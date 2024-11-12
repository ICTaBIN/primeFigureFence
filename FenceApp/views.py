from django.shortcuts import render
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
from .models import Customer, Proposal

import base64



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# Add these functions after the existing helper functions












# Add these routes after the existing routes

def company_settings(request):
    company_info = load_company_info()
    financials = load_financials()
    return render(request,'company_settings.html',
                           company_info=company_info,
                           financials=financials)



def save_company_settings(request):
    try:
        form_data = request.form.to_dict()

        # Handle company info
        company_info = {
            "name": form_data.get('company_name', ''),
            "address": form_data.get('company_address', ''),
            "phone": form_data.get('company_phone', ''),
            "email": form_data.get('company_email', ''),
            "website": form_data.get('company_website', ''),
            "logo": form_data.get('existing_logo', '')  # Preserve existing logo if no new one
        }

        # Handle logo upload
        if 'company_logo' in request.files:
            file = request.files['company_logo']
            if file and file.filename:
                # Convert to base64
                file_content = file.read()
                encoded = base64.b64encode(file_content).decode('utf-8')
                company_info['logo'] = f"data:image/{file.filename.split('.')[-1]};base64,{encoded}"

        # Handle financials
        financials = load_financials()

        # Update labor rates
        for fence_type in ['chain_link', 'iron_fence', 'wood_privacy']:
            for height in ['4', '5', '6', '8']:
                rate_key = f'labor_rate_{fence_type}_{height}'
                if rate_key in form_data and form_data[rate_key]:
                    if height not in financials['laborRates'][fence_type]:
                        financials['laborRates'][fence_type][height] = 0
                    financials['laborRates'][fence_type][height] = float(form_data[rate_key])

        # Update overhead rates
        financials['overheadRates']['profitMargin'] = float(form_data.get('profit_margin', 0.77))
        financials['overheadRates']['taxRate'] = float(form_data.get('tax_rate', 0.08))
        financials['overheadRates']['wasteFactor'] = float(form_data.get('waste_factor', 1.1))

        save_company_info(company_info)
        save_financials(financials)

        return JsonResponse({"success": True})
    except Exception as e:
        logger.error(f"Error saving company settings: {e}")
        return JsonResponse({"error": str(e)}, status=500)




























def dashboard(request):
    return render(request,'dashboard.html')



def create_proposal(request):
    try:
        data = request.get_json()
        proposal_id = str(uuid.uuid4())
        customer_id = data.get('customer_id')

        # Convert numeric strings to floats explicitly
        total = float(data.get('total', '0').replace('$', '').strip())
        tax = float(data.get('tax', '0').replace('$', '').strip())
        subtotal = total - tax  # Calculate subtotal from total and tax

        proposals = load_proposals()
        proposals[proposal_id] = {
            "customer_id": customer_id,
            "height": data['height'],
            "style": data['style'],
            "gates": data['gates'],
            "totalLinearFeet": data['totalLinearFeet'],
            "cornerPosts": data['cornerPosts'],
            "endPosts": data['endPosts'],
            "linePosts": data['linePosts'],
            "materialCost": float(str(data['materialCost']).replace('$', '').strip()),
            "laborCost": float(str(data['laborCost']).replace('$', '').strip()),
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "drawing": data['drawing']
        }
        save_proposals(proposals)
        return JsonResponse({"proposal_id": proposal_id})
    except Exception as e:
        logger.error(f"Error creating proposal: {e}")
        return JsonResponse({"error": str(e)}, status=500)



def view_proposal(request, proposal_id):
    try:
        proposals = load_proposals()

        proposal_data = proposals.get(proposal_id)
        if not proposal_data:
            logger.error(f"Proposal {proposal_id} not found")
            return JsonResponse({"error": "Proposal not found"}, status=404)

        # Convert string values to float and clean up any currency symbols
        try:
            total = float(str(proposal_data.get('total', '0')).replace('$', '').strip())
            tax = float(str(proposal_data.get('tax', '0')).replace('$', '').strip())

            # Update the proposal data with cleaned numeric values
            proposal_data.update({
                'total': total,
                'tax': tax,
                'subtotal': total - tax,
                'materialCost': float(str(proposal_data.get('materialCost', '0')).replace('$', '').strip()),
                'laborCost': float(str(proposal_data.get('laborCost', '0')).replace('$', '').strip())
            })
        except ValueError as e:
            logger.error(f"Error converting numeric values: {e}")
            # Provide default values if conversion fails
            proposal_data.update({
                'total': 0.0,
                'tax': 0.0,
                'subtotal': 0.0,
                'materialCost': 0.0,
                'laborCost': 0.0
            })

        customer = {}
        customer_id = proposal_data.get('customer_id')
        if customer_id:
            customers = load_customers()
            customer = customers.get(customer_id, {})
            logger.info(f"Loaded customer data for ID {customer_id}: {customer}")

        company_info = load_company_info()

        return render(request,'proposal1.html',
                               proposal=proposal_data,
                               customer=customer,
                               company=company_info)
    except Exception as e:
        logger.error(f"Error viewing proposal: {e}")
        return JsonResponse({"error": f"Error loading proposal: {str(e)}"}, status=500)




def pricing(request):
    files = [f for f in os.listdir(PRICING_DIR) if f.endswith('.json')]
    return render(request,'pricing.html', files=files)




def get_data(request, filename: str):
    return JsonResponse(load_json_file(filename))




def save_data(request, filename: str):
    data = request.json
    save_json_file(filename, data)
    return JsonResponse({"status": "success"})




def get_material_file(request, filename: str):
    return send_from_directory(PRICING_DIR, filename)



def drawing_tool(request):
    return render(request,"drawingtool.html")



def wood_fence(request):
    return render(request,"wood_fence.html")



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

        return JsonResponse({"success": True, "customer_id": customer.id})
    
    return JsonResponse({"error": "Method not allowed"}, status=405)


# proposals = load_proposals()
# init_template_file()
