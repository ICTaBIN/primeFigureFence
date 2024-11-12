from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    website = models.URLField()
    logo = models.ImageField(null=True)

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    email = models.EmailField()

    def __str__(self):
        return self.name


class Material(models.Model):
    material = models.CharField(max_length=255, choices=[
        ('WOOD FENCE', 'wood_fence'),
        ('IRON FENCE', 'iron_fence'),
        ('CHAINLINK', 'chainlink'),
    ])


