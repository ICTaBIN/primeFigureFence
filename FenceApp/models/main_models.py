from django.db import models
from django.contrib.auth.models import AbstractUser
from ..managers import CustomUserManager



class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=False) # by default user won't be active
    USERNAME_FIELD = 'email'
    username=None
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email



class Company(models.Model):
    FENCE_TYPES = [
        ('chain_link', 'Chain Link'),
        ('iron_fence', 'Iron Fence'),
        ('wood_privacy', 'Wood Privacy'),
    ]
    
    FENCE_HEIGHTS = [
        ('4', "4"),
        ('5', "5"),
        ('6', "6"),
        ('8', "8"),
    ]

    # Basic Info
    name = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.ForeignKey(CustomUser, on_delete=models.CASCADE) 
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True)

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Company"

    def __str__(self):
        return self.name

    @property
    def get_fence_types(self):
        return [ft[0] for ft in self.FENCE_TYPES]

    @property
    def get_fence_heights(self):
        return [h[0] for h in self.FENCE_HEIGHTS]


class Customer(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Proposal(models.Model):
    # Customer Information
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, null=True, blank=True)
    
    # Basic Information
    height = models.CharField(max_length=10, null=True, blank=True)
    style = models.JSONField()
    
    # Quantity Information
    gates = models.CharField(max_length=10, null=True, blank=True)
    total_linear_feet = models.FloatField(null=True, blank=True)
    corner_posts = models.IntegerField(null=True, blank=True)
    end_posts = models.IntegerField(null=True, blank=True)
    line_posts = models.IntegerField(null=True, blank=True)
    
    # Cost Breakdown
    material_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tax = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Drawing Data - storing base64 image data
    drawing = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Proposal for {self.customer} - Total: ${self.total or 0}"

    class Meta:
        verbose_name = "Proposal"
        verbose_name_plural = "Proposals"

    


