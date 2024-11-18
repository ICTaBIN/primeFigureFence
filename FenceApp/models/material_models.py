
from django.db import models


class MaterialCategory(models.Model):
    name = models.CharField(max_length=255)
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Material Categories"



class MaterialType(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey('MaterialCategory', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ----------- Category: {self.category}"


class Material(models.Model):
    material_data = models.JSONField()
    material_type = models.ForeignKey('MaterialType',on_delete=models.CASCADE)

    def __str__(self):
        return self.material_data.get("name")
