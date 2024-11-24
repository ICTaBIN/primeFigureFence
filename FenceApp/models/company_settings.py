from django.db import models
from .main_models import Company  # Now we need this import for the choices

class LaborRate(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    fence_type = models.CharField(
        max_length=20, 
        choices=Company.FENCE_TYPES
    )
    height = models.CharField(
        max_length=2,
        choices=Company.FENCE_HEIGHTS
    )
    rate = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"rate of {self.fence_type} fence with height {self.height} feet in Company {self.company} is {self.rate}"

    class Meta:
        unique_together = ['company', 'fence_type', 'height']
        


class OverheadRates(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    profit_margin = models.DecimalField(max_digits=4, decimal_places=2, default=0.74)
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0.08)
    waste_factor = models.DecimalField(max_digits=3, decimal_places=2, default=1.1)

    def __str__(self):
        return f"Overhead Rates for {self.company}"

    class Meta:
        verbose_name_plural = "Overhead Rates"
        unique_together = ['company']  # One set of rates per company
