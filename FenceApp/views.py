from django.shortcuts import render, get_object_or_404, redirect
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
from .models import Customer, Company, LaborRate, OverheadRates, Proposal, MaterialCategory, Material

import base64
from django.contrib import messages
from django.urls import reverse



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# Add these functions after the existing helper functions



def company_settings(request, company_id):
    # Get specific company or 404
    company = get_object_or_404(Company, id=company_id)

    if request.method == 'POST':
        try:
            # 1. Update Company Info - only update fields that were sent
            company.name = request.POST.get('company_name', company.name)
            company.address = request.POST.get('company_address', company.address)
            company.phone = request.POST.get('company_phone', company.phone)
            company.email = request.POST.get('company_email', company.email)
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
            return redirect('company_settings', company_id=company_id)
        except Exception as e:
            messages.error(request, f'Error saving settings: {str(e)}')
            return redirect('company_settings', company_id=company_id)

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



def dashboard(request):
    return render(request,'dashboard.html')


def create_proposal(request):
    print("just before try")
    try:
        # Get data from request
        data = request.POST
        customer_id = data.get('customer_id')
        customer = Customer.objects.get(id=customer_id)

        # Create Style instance
        style = Style.objects.create(
            pickets=data.get('style[pickets]', ''),
            posts=data.get('style[posts]', ''),
            rails=data.get('style[rails]', ''),
            fasteners=data.get('style[fasteners]', ''),
            gates=data.get('style[gates]', '')
        )

        # Convert numeric strings to floats explicitly
        total = float(data.get('total', '0').replace('$', '').strip())
        tax = float(data.get('tax', '0').replace('$', '').strip())
        subtotal = total - tax  # Calculate subtotal from total and tax

        # Create Proposal instance
        proposal = Proposal.objects.create(
            customer=customer,
            height=data.get('height', ''),
            style=style,
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

        return JsonResponse({"proposal_id": proposal.id})

    except Customer.DoesNotExist:
        logger.error(f"Customer with id {customer_id} not found")
        return JsonResponse({"error": "Customer not found"}, status=404)
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        return JsonResponse({"error": str(e)}, status=500)


def view_proposal(request, proposal_id):
    try:
        proposal = get_object_or_404(Proposal, id=proposal_id)
        customer = proposal.customer
        company = Company.objects.first()

        context = {
            'proposal': proposal,
            'customer': customer,
            'company': company
        }
        return render(request, 'proposal1.html', context)
    except Exception as e:
        logger.error(f"Error viewing proposal: {e}")
        messages.error(request, f"Error viewing proposal: {str(e)}")
        return redirect('dashboard')




def pricing(request):
    # all available material categories
    all_categories = MaterialCategory.objects.all()

    # lookup chosen category in database
    user_selected_category= request.GET.get('material_category',None)
    print(user_selected_category)
    category = MaterialCategory.objects.get(name=user_selected_category) if user_selected_category else None
    # print(category)

    materials = Material.objects.filter(category = category) if category else None
    print('found materails ',materials)
    context = {'material_categories': all_categories,'selected_category': user_selected_category, 'materials': materials}
    return render(request,'pricing.html', context=context) #files=files




def get_data(request, filename: str):
    return JsonResponse(load_json_file(filename))




def save_data(request, filename: str):
    data = request.json
    save_json_file(filename, data)
    return JsonResponse({"status": "success"})




def get_material_file(request, filename: str):
    print('file requested: ',filename)
    return send_from_directory(PRICING_DIR, filename)



def drawing_tool(request):
    return render(request,"drawingtool.html")



def wood_fence(request):
    return render(request, 'wood_fence.html')



def chain_link_fence(request):
    return render(request,"chainlink_fence.html")



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



def customer_list(request):
    customer_list = Customer.objects.all()
    print(customer_list)
    return render(request,'customer_list.html', context={'customer_list': customer_list})



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



def customer_data(request):
    return render(request,'customer_data.html')



def submit_customer_data(request):

    if request.method == 'POST':

        data = request.POST

        name = data['name']
        address = data['address']
        phone = data['phone']
        email = data['email']
        
        customer = Customer(name=name, address=address, phone=phone, email=email)
        customer.save()

        return redirect('customer_list')
    return JsonResponse({"error": "Method not allowed"}, status=405)




