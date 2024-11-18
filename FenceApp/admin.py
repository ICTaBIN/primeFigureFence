from django.contrib import admin
from .models import *


admin.site.register(Customer)

admin.site.register(Company)
admin.site.register(OverheadRates)   
admin.site.register(LaborRate) 

admin.site.register(MaterialCategory)
admin.site.register(MaterialType)
admin.site.register(Material)  

admin.site.register(Proposal)   