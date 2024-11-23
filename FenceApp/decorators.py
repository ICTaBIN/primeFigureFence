from django.shortcuts import redirect
from django.urls import reverse

def custom_login_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        # Check if the user is authenticated
        if request.user.is_authenticated and not request.user.is_superuser:
                # if user is signed in and is not superuser let the user access the view( the dashboard)
                return view_func(request, *args, **kwargs)
        else:
            # If the user is not authenticated, redirect to the login page
            return redirect('login')  # Change 'login' to the actual name of your login URL
    return _wrapped_view



def redirect_if_logged_in(view_func):
    def _wrapped_view(request, *args, **kwargs):
        # Check if the user is authenticated
        if request.user.is_authenticated and not request.user.is_superuser:
            # Redirect to the dashboard
            return redirect(reverse('dashboard'))
        # Call the original view function if the user is not authenticated
        return view_func(request, *args, **kwargs)
    return _wrapped_view