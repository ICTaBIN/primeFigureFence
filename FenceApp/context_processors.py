from django.shortcuts import get_object_or_404
from .models import LaborRate, Company, OverheadRates

def company_global_rates(request):
    if not request.user.is_authenticated or request.user.is_superuser:
        # Handle unauthenticated users or superusers
        return {
            "labor_rate": 0,
            "overhead_rates": {
                "tax_rate": 0,
                "margin_percent": 0
            }
        }
    
    try:
        # Get the company associated with the authenticated user
        company = get_object_or_404(Company, email=request.user)

        # Try to fetch labor rate for the given parameters
        labor_rate = LaborRate.objects.filter(
            fence_type='wood_privacy',
            height='6',
            company=company
        ).first()
        # If no labor rate exists, set default values
        if not labor_rate:
            labor_rate_value = 0
        else:
            labor_rate_value = labor_rate.rate

        # Try to fetch overhead rates for the company
        overhead_rates = OverheadRates.objects.filter(company=company).first()

        # If no overhead rates exist, set default values
        if not overhead_rates:
            tax_rate = 0
            margin_percent = 0
        else:
            tax_rate = overhead_rates.tax_rate * 100
            margin_percent = (1 - overhead_rates.profit_margin) * 100

        # Return the final result
        return {
            "labor_rate": labor_rate_value,
            "overhead_rates": {
                "tax_rate": tax_rate,
                "margin_percent": margin_percent
            }
        }

    except Exception as e:
        # Handle unexpected errors gracefully
        return {
            "labor_rate": 0,
            "overhead_rates": {
                "tax_rate": 0,
                "margin_percent": 0
            },
            "error": str(e)  # Optionally include the error for debugging
        }
