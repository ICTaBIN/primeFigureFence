from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import logout
from itertools import chain
from django.http import JsonResponse
from .utils import *
# from flask import Flask, render, request, JsonResponse, send_from_directory
import json
import logging
from .models import Customer, Company, LaborRate, OverheadRates, Proposal, MaterialCategory, MaterialType, Material
from django.contrib import messages
from .decorators import custom_login_required, redirect_if_logged_in



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# Add these functions after the existing helper functions

@redirect_if_logged_in
def login_view(request):
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

            print("_________________________________Setting Overhead Rates_________________________________")
            if request.POST.get('profit_margin'):
                print(f'the profit margin is : {request.POST.get("profit_margin")}')
                overhead.profit_margin = request.POST.get('profit_margin')
            if request.POST.get('tax_rate'):
                print(f'the tax rate is : {request.POST.get("tax_rate")}')
                overhead.tax_rate = request.POST.get('tax_rate')
            if request.POST.get('waste_factor'):
                print(f'the waste factor is : {request.POST.get("waste_factor")}')
                overhead.waste_factor = request.POST.get('waste_factor')
            overhead.save()

            # 3. Update LaborRates - only update rates that were provided
            print("_________________________________Setting Labor Rates_________________________________")
            for fence_type in company.get_fence_types:
                print(f"\nFor Fence Type: {fence_type}")
                for height in company.get_fence_heights:
                    rate_key = f'labor_rate_{fence_type}_{height}'
                    if rate_key in request.POST and request.POST[rate_key]:
                        print(f"\tLabor Rate for Height {height}: ",request.POST[rate_key])
                        rate = LaborRate.objects.filter(
                            company=company,
                            fence_type=fence_type,
                            height=height
                        ).first()
                        print("rate obj: ",rate)
                        if rate:
                            rate.rate = request.POST[rate_key]
                        else:
                            LaborRate.objects.create(
                                company=company,
                                fence_type=fence_type,
                                height=height,
                                rate=request.POST[rate_key]
                            )
                        rate.save()

            messages.success(request, 'Company settings saved successfully!')
            return redirect('company_settings')
        except Exception as e:
            messages.error(request, f'Error saving settings: {str(e)}')
            return redirect('company_settings')
    
    # COME UP WITH THE LOGIC
    labor_rates = {}
    for fence_type in company.get_fence_types:
        print(fence_type)
        labor_rates[fence_type] = {}
        for height in company.get_fence_heights:
            print(height)
            rate, created = LaborRate.objects.get_or_create(company=company, fence_type=fence_type, height=height,defaults={'rate': 0})
            print('created is ',created)

            # if there was no rate for certain height it defaults to 0
            labor_rates[fence_type][height] = rate.rate 

     
    # Flatten the data for easier template rendering
    rates = []
    for fence_type, heights in labor_rates.items():
        for height, rate in heights.items():
            rates.append({
                'fence_type': fence_type,
                'height': height,
                'rate': rate
            })
    
    print(rates)
    
    context = {
        'company_info': company,
        'overhead': OverheadRates.objects.filter(company=company).first(),
        'fence_types': company.get_fence_types,
        'heights': company.get_fence_heights,
        'labor_rates': rates
    }
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
        print("while creating proposal --- the styles were : ",data.get('style'))
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

    # lookup chosen category in database i.e WoodFence, IronFence
    user_selected_category= request.GET.get('material_category',None)
    category = MaterialCategory.objects.get(name=user_selected_category) if user_selected_category else None

    # all materials of that specific category i.e for WoodFence:  concrete, Fasteners etc
    material_types = MaterialType.objects.filter(category = category) if category else None

    # lookup chosen material type in database i.e Concrete
    user_selected_material_type = request.GET.get('material_type',None)

    # lookup all instances of that material type i.e for Concrete : concrete 50lb, concrete 80lb
    material_type = MaterialType.objects.filter(name=user_selected_material_type, category=category) if user_selected_material_type else None
    print(material_type,'is the material type')
    selected_materials = None
    if material_type:
        selected_materials = Material.objects.filter(material_type__in=material_type)
    
    print(selected_materials,'are the selected materials')
    

    context = {
        'material_categories': all_categories,  # WoodFence, IronFence etc
        'selected_category': user_selected_category,  # WoodFence  
        'material_types': material_types,  # WoodFence ->   Concrete, Fasteners etc
        'selected_material_type' : material_type,  # Concrete
        'material_instances' : selected_materials  # Concrete 50lb, Concrete 80lb 
        
        }
    return render(request,'pricing.html', context=context)

@csrf_exempt
@custom_login_required
def update_material_instance(request, material_instance_id):
    print(request.POST,'data for updating')
    if request.method == "POST":
        try:
            # Retrieve the existing material instance
            material_instance = Material.objects.get(id=material_instance_id)

            # Update the material_data field from the POST data
            material_name = request.POST.get("name")
            material_price = request.POST.get("price")


            # additional data attributes
            updated_data = request.POST.dict()
            material_data = {
                key.replace("material_data[", "").replace("]", ""): value
                for key, value in updated_data.items()
                if key.startswith("material_data[")
            }

            # Save changes to the instance
            material_instance.name = material_name
            material_instance.price = material_price
            material_instance.material_data = material_data
            material_instance.save()

            # Show success message
            messages.success(request, "Material was updated successfully!", extra_tags="success")

            # Optionally render a partial or updated HTML for this item
            return render(request, 'partials/material_item.html', {'material_instance': material_instance})

        except Material.DoesNotExist:
            # Handle case where material with the given ID doesn't exist
            messages.error(request, "Material not found.", extra_tags="error")

    # Return the same view on error or GET request
    return render(request, 'partials/message.html')

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
    # fetch all types under 'WoodFence Category'
    material_category= MaterialCategory.objects.get(name='WoodFence')

    wood_fence_materials = MaterialType.objects.filter(category=material_category)

    grouped_materials  = {}
    for material in wood_fence_materials:
        grouped_materials[material.name]  = material.material_set.all()

    context={
        "grouped_materials" : grouped_materials,
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
def add_material(request):
    if request.method == 'POST':
        print(f"inside the add_material: POST data: {request.POST}")
        # Extract name and price from form data
        name = request.POST.get('name')
        price = request.POST.get('price')
        material_type_id = request.POST.get('material_type')  # Assume material_type is passed in the form

        # Extract additional dynamic fields
        material_data = {}
        for key, value in request.POST.items():
            if key not in ['name', 'price', 'csrfmiddlewaretoken', 'material_category', 'material_type']:
                material_data[key] = value

        # Fetch the MaterialType instance (modify as per your setup)
        material_type = MaterialType.objects.get(id=material_type_id)

        # Create and save the Material instance
        material = Material.objects.create(
            name=name,
            price=price,
            material_data=material_data,
            material_type=material_type,
        )
        return redirect('material-items-list')  # Replace with your success page

    # For GET requests, render the form
    return render(request, 'add_material.html')


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




@custom_login_required
def get_material_categories(request):
    categories = MaterialCategory.objects.all()
    return render(request, 'partials/material_categories.html', context= {'categories': categories})



@custom_login_required
def get_material_types(request):
    material_category = request.GET.get('material_category')
    category = MaterialCategory.objects.get(id=material_category)
    print(f"category: {category}")
    material_types = MaterialType.objects.filter(category=category)
    print(f"material_type: {material_types}")
    return render(request, 'partials/material_types.html', {'material_types': material_types})




@custom_login_required
def material_items_list(request):
    material_items_list = Material.objects.all()
    print(material_items_list)
    return render(request,'material_items_list.html', context={'material_items_list': material_items_list})












