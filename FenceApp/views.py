from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout
from collections import defaultdict
from itertools import chain
from django.http import JsonResponse
from .utils import *
# from flask import Flask, render, request, JsonResponse, send_from_directory
import json
import os
import math
from functools import wraps
from typing import Dict, Any, Callable
import logging
import uuid
from .models import Customer, Company, LaborRate, OverheadRates, Proposal, MaterialCategory, MaterialType, Material

import base64
from django.contrib import messages
from django.urls import reverse
from .decorators import custom_login_required, redirect_if_logged_in



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# Add these functions after the existing helper functions

@redirect_if_logged_in
def login(request):
    return render(request,'login.html')

def logout_view(request):
    logout(request)
    return redirect("/")

@custom_login_required
def dashboard(request):
    return render(request,'dashboard.html')

@custom_login_required
def company_settings(request):
    # Get specific company or 404
    company = get_object_or_404(Company, email=request.user)

    if request.method == 'POST':
        try:
            # 1. Update Company Info - only update fields that were sent
            company.name = request.POST.get('company_name', company.name)
            company.address = request.POST.get('company_address', company.address)
            company.phone = request.POST.get('company_phone', company.phone)
            company.website = request.POST.get('company_website', company.website)

            # Only update logo if new one was uploaded
            if 'company_logo' in request.FILES:
                company.logo = request.FILES['company_logo']

            company.save()

            # 2. Update OverheadRates - only if values provided
            overhead = OverheadRates.objects.filter(company=company).first()
            if not overhead:
                overhead = OverheadRates(company=company)

            if request.POST.get('profit_margin'):
                overhead.profit_margin = request.POST.get('profit_margin')
            if request.POST.get('tax_rate'):
                overhead.tax_rate = request.POST.get('tax_rate')
            if request.POST.get('waste_factor'):
                overhead.waste_factor = request.POST.get('waste_factor')
            overhead.save()

            # 3. Update LaborRates - only update rates that were provided
            for fence_type in company.get_fence_types:
                for height in company.get_fence_heights:
                    rate_key = f'labor_rate_{fence_type}_{height}'
                    if rate_key in request.POST and request.POST[rate_key]:
                        rate = LaborRate.objects.filter(
                            company=company,
                            fence_type=fence_type,
                            height=height
                        ).first()
                        
                        if rate:
                            rate.rate = request.POST[rate_key]
                            rate.save()
                        else:
                            LaborRate.objects.create(
                                company=company,
                                fence_type=fence_type,
                                height=height,
                                rate=request.POST[rate_key]
                            )

            messages.success(request, 'Company settings saved successfully!')
            return redirect('company_settings')
        except Exception as e:
            messages.error(request, f'Error saving settings: {str(e)}')
            return redirect('company_settings')

    # For GET request
    rates = LaborRate.objects.filter(company=company)
    labor_rates_dict = {}
    for rate in rates:
        print("rate", rate)
        if rate.fence_type not in labor_rates_dict:
            labor_rates_dict[rate.fence_type] = {}
        labor_rates_dict[rate.fence_type][rate.height] = rate.rate

    context = {
        'company_info': company,
        'overhead': OverheadRates.objects.filter(company=company).first(),
        'fence_types': company.get_fence_types,
        'heights': company.get_fence_heights,
        'labor_rates': labor_rates_dict
    }
    print("labor_rates", labor_rates_dict)

    return render(request, 'company_settings.html', context=context)


@csrf_exempt
@custom_login_required
def create_proposal(request):
    print("just before try")
    try:
        # Get data from request
        # data = request.POST
        data = json.loads(request.body)
        print(data.get('height'), 'i got the data')
        customer_id = request.session.get('customer_id')
        customer = Customer.objects.get(id=customer_id)


        # Convert numeric strings to floats explicitly
        total = float(data.get('total', '0').replace('$', '').strip())
        tax = float(data.get('tax', '0').replace('$', '').strip())
        subtotal = total - tax  # Calculate subtotal from total and tax

        # Create Proposal instance
        proposal = Proposal.objects.create(
            customer=customer,
            height=data.get('height', ''),
            style=data.get('style',{}),
            gates=data.get('gates', '0'),
            total_linear_feet=data.get('totalLinearFeet', '0'),
            corner_posts=data.get('cornerPosts', '0'),
            end_posts=data.get('endPosts', '0'),
            line_posts=data.get('linePosts', '0'),
            material_cost=float(str(data.get('materialCost', '0')).replace('$', '').strip()),
            labor_cost=float(str(data.get('laborCost', '0')).replace('$', '').strip()),
            subtotal=subtotal,
            tax=tax,
            total=total,
            drawing=data.get('drawing', '')
        )
        print(data.get('drawing'))

        return JsonResponse({"proposal_id": proposal.id})

    except Customer.DoesNotExist:
        logger.error(f"Customer with id {customer_id} not found")
        return JsonResponse({"error": "Customer not found"}, status=404)
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@custom_login_required
def view_proposal(request, proposal_id):
    try:
        proposal = get_object_or_404(Proposal, id=proposal_id)
        customer = proposal.customer
        company = Company.objects.first()


        # Access model fields correctly
        total = float(str(proposal.total).replace('$', '').strip() or '0')
        tax = float(str(proposal.tax).replace('$', '').strip() or '0')
        materialCost = float(str(proposal.material_cost).replace('$', '').strip() or '0')
        laborCost = float(str(proposal.labor_cost).replace('$', '').strip() or '0')

        # Calculate subtotal
        subtotal = total - tax

        # Update proposal values
        proposal.total = total
        proposal.tax = tax
        proposal.subtotal = subtotal
        proposal.material_cost = materialCost
        proposal.labor_cost = laborCost

        proposal.save()

        context = {
            'proposal': proposal,
            'customer': customer,
            'company': company,
        }
        return render(request, 'proposal1.html', context)

    except Exception as e:
        logger.error(f"Error viewing proposal: {e}")
        messages.error(request, f"Error viewing proposal: {str(e)}")
        return redirect('dashboard')


@custom_login_required
def pricing(request):

    # all available material categories
    all_categories = MaterialCategory.objects.all()

    # lookup chosen category in database
    user_selected_category= request.GET.get('material_category',None)
    category = MaterialCategory.objects.get(name=user_selected_category) if user_selected_category else None

    # all materials of that specific category
    material_types = MaterialType.objects.filter(category = category) if category else None

    # lookup chosen material instances in database
    user_selected_material_type = request.GET.get('material_type',None)
    print('going for serach')
    material_type = MaterialType.objects.filter(name=user_selected_material_type, category=category) if user_selected_material_type else None
    print(material_type,'is the material type')
    selected_materials = None
    if material_type:
        selected_materials = Material.objects.filter(material_type__in=material_type)
    
    print(selected_materials,'are the selected materials')
    


    
    context = {
        'material_categories': all_categories,
        'selected_category': user_selected_category,
        'material_types': material_types,
        'selected_material_type' : material_type,
        'material_instances' : selected_materials
        
        }
    return render(request,'pricing.html', context=context) #files=files


@csrf_exempt
@custom_login_required
def delete_material_instance(request, material_instance_id):

    try:
        # Ensure the Material instance exists before deleting
        material_instance = Material.objects.get(id=material_instance_id)
        material_instance.delete()  # Delete the material instance

        # Show success message
        messages.success(request, "Material was deleted!", extra_tags="success")
    except Material.DoesNotExist:
        # Handle case where material with the given ID doesn't exist
        messages.error(request, "Material not found.", extra_tags="error")

    return render(request, 'partials/message.html')




# @csrf_exempt
# def add_material_instance(request):
#     material_data = request.POST.dict()
#     print('is the matearifdasa', material_data)
#     material_type_id =  material_data.get("material_type_id",None)
#     print(material_type_id,'is therf io jisftype id')
#     material_type = MaterialType.objects.get("material_type_id")
#     print(material_type)

#     material_data.pop("material_type_id")
#     Material(material_data=material_data, material_type = material_type)



#     print(material_data)
#     return render(request,'partials/item.html', context = {"material_data" : material_data})






def get_data(request, filename: str):
    return JsonResponse(load_json_file(filename))




def save_data(request, filename: str):
    data = request.json
    save_json_file(filename, data)
    return JsonResponse({"status": "success"})




def get_material_file(request, filename: str):  # filename refers to material category

    # category = MaterialCategory.objects.get(name=filename)
    # types = MaterialType.objects.filter(category=category)
    # materials = [type.material_set.all().values() for type in types]
    # print("\n\n")
    # print(list(materials))
    # print("\n\n")
    category = MaterialCategory.objects.get(name=filename)
    types = MaterialType.objects.filter(category=category)

    # Flatten the materials list
    materials = list(chain.from_iterable(type.material_set.all().values() for type in types))

    # Print the flattened materials
    print("\n\n")
    print(materials)  # Now it's a flat list of dictionaries
    print("\n\n")

    return JsonResponse(materials, safe=False) #send_from_directory(PRICING_DIR, filename)



def drawing_tool(request):
    customer_id = request.GET.get('customer_id')
    request.session['customer_id'] = customer_id
    print('customer_id passed to drawing tool',customer_id)
    return render(request,"drawingtool.html",context={"customer_id" : customer_id})


@custom_login_required
def wood_fence(request):
    print(request.POST)
    material_category= MaterialCategory.objects.get(name='WoodFence')

    wood_fence_materials = MaterialType.objects.filter(category=material_category)

    grouped_materials  = {}
    for material in wood_fence_materials:
        grouped_materials[material.name]  = material.material_set.all()
    
    company = company = get_object_or_404(Company, email=request.user)


    labor_rate = LaborRate.objects.get(fence_type='wood_privacy', height='6', company=company)
    overhead_rates = OverheadRates.objects.get(company=company)
    

    print(labor_rate,'was the labor_rate')
    print(overhead_rates)
    


    context={
        "grouped_materials" : grouped_materials,
        "labor_rate" : labor_rate,
        "overhead_rates" : {"tax_rate" : overhead_rates.tax_rate*100,
                             "margin_percent" : (1-overhead_rates.profit_margin) *100 
                           }
            }

    return render(request, 'wood_fence.html',context=context)


@custom_login_required
def iron_fence(request):

    material_category= MaterialCategory.objects.get(name='IronFence')
    wood_fence_materials = MaterialType.objects.filter(category=material_category)

    grouped_materials  = {}
    for material in wood_fence_materials:
        grouped_materials[material.name]  = material.material_set.all()


    context={
        "grouped_materials" : grouped_materials
            }
    return render(request,'iron_fence.html',context=context)


@custom_login_required
def chain_link_fence(request):

    material_category= MaterialCategory.objects.get(name='ChainLink')
    wood_fence_materials = MaterialType.objects.filter(category=material_category)

    grouped_materials  = {}
    for material in wood_fence_materials:
        grouped_materials[material.name]  = material.material_set.all()


    context={
        "grouped_materials" : grouped_materials
            }
    return render(request,"chainlink_fence.html",context=context)



def get_templates(request):
    try:
        if not TEMPLATE_FILE.exists():
            init_template_file()
            return JsonResponse({})

        templates = json.loads(TEMPLATE_FILE.read_text())
        return JsonResponse(templates)
    except Exception as e:
        logger.error(f"Error loading templates: {e}")
        return JsonResponse({}, status=500)



def save_template(request):
    try:
        template_data = request.json
        if not template_data or 'name' not in template_data:
            logger.error("Invalid template data received")
            return JsonResponse({"error": "Invalid template data"}, status=400)

        if not TEMPLATE_FILE.exists():
            init_template_file()

        templates = json.loads(TEMPLATE_FILE.read_text())
        templates[template_data['name']] = template_data['data']
        TEMPLATE_FILE.write_text(json.dumps(templates, indent=2))

        return JsonResponse({"success": True})
    except Exception as e:
        logger.error(f"Error saving template: {e}")
        return JsonResponse({"error": str(e)}, status=500)



def delete_template(request, name):
    try:
        if not TEMPLATE_FILE.exists():
            return JsonResponse({"success": False, "error": "No templates found"}, status=404)

        templates = json.loads(TEMPLATE_FILE.read_text())

        if name in templates:
            del templates[name]
            TEMPLATE_FILE.write_text(json.dumps(templates, indent=2))
            return JsonResponse({"success": True})

        return JsonResponse({"success": False, "error": "Template not found"}, status=404)
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        return JsonResponse({"error": str(e)}, status=500)



# def serve_static(request, filename):
#     return send_from_directory(app.static_folder, filename)


@custom_login_required
def customer_list(request):
    company = get_object_or_404(Company, email=request.user)
    customer_list = Customer.objects.filter(company=company)
    print(customer_list)
    return render(request,'customer_list.html', context={'customer_list': customer_list})


@custom_login_required
def customer_proposals(request, customer_id):
    
    customer = Customer.objects.get(id=customer_id)

    if not customer:
        return JsonResponse({"error": "Customer not found"}, status=404)
    
    customer_proposals = Proposal.objects.filter(customer_id=customer_id)

    return render(request,
        'customer_proposals.html',
        context={
            'proposals': customer_proposals,
            'customer': customer
        }
    )


@custom_login_required
def customer_data(request):
    return render(request,'customer_data.html')


@custom_login_required
def submit_customer_data(request):

    if request.method == 'POST':

        data = request.POST
        company = get_object_or_404(Company, email=request.user)
        name = data['name']
        address = data['address']
        phone = data['phone']
        email = data['email']
        
        customer = Customer(name=name, address=address, phone=phone, email=email,company=company)
        customer.save()

        return redirect('customer_list')
    return JsonResponse({"error": "Method not allowed"}, status=405)




