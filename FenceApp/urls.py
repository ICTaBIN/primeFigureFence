from django.urls import path
from . import views


urlpatterns = [
    path('', views.dashboard, name="dashboard"),
    path('company_settings/<int:company_id>/', views.company_settings, name="company_settings"),
    # path('save_company_settings/', views.save_company_settings, name="save_company_settings"),
    path('create_proposal/', views.create_proposal, name="create_proposal"),
    path('proposal/<str:proposal_id>/', views.view_proposal, name="proposal"),
    path('pricing/', views.pricing, name="pricing"),
    path('data/<str:filename>/', views.get_data, name="data"),
    path('save/<str:filename>/', views.save_data, name="save"),
    path('materials/<str:filename>/', views.get_material_file, name="materials"),
    path('drawingtool/', views.drawing_tool, name="drawingtool"),
    path('wood_fence/', views.wood_fence, name="wood_fence"),
    path('chainlink_fence/', views.chain_link_fence, name="chainlink_fence"),
    path('api/templates/', views.get_templates, name="api_templates"),
    path('api/templates/', views.save_template, name="api_templates_save"),
    path('api/templates/<name>/', views.delete_template, name="api_templates_delete"),
    # path('static/<path:filename>/', views.serve_static, name="static")
    path('customer_list/', views.customer_list, name="customer_list"),
    path('customer_proposals/<customer_id>/', views.customer_proposals, name="customer_proposals"),
    path('customer_data/', views.customer_data, name="customer_data"),
    path('submit_customer_data/', views.submit_customer_data, name="submit_customer_data"),

    path('delete_material_instance/<str:material_instance_id>', views.delete_material_instance, name="delete_material_instance"),
    # path('add_material_instance/', views.add_material_instance, name="add_material_instance")

]
