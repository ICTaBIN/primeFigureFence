from django.db import models

class WoodFenceConcrete(models.Model):
    """Maps to 'concrete' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=10)
    width = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Concrete"
        verbose_name_plural = "Concrete"


class WoodFenceFasteners(models.Model):
    """Maps to 'fasteners' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    qty = models.CharField(max_length=10)
    sku = models.CharField(max_length=10)

    class Meta:
        verbose_name = "Fastener"
        verbose_name_plural = "Fasteners"


class WoodFenceGates(models.Model):
    """Maps to 'gates' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=10)
    width = models.DecimalField(max_digits=3, decimal_places=0)
    fence_height = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Gate"
        verbose_name_plural = "Gates"


class WoodFencePickets(models.Model):
    """Maps to 'pickets' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=10)
    width = models.DecimalField(max_digits=3, decimal_places=0)
    fence_height = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Picket"
        verbose_name_plural = "Pickets"


class WoodFencePosts(models.Model):
    """Maps to 'posts' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=10)
    fence_height = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"


class WoodFenceRails(models.Model):
    """Maps to 'rails' in woodFenceMaterials.json"""
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sku = models.CharField(max_length=10)
    width = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Rail"
        verbose_name_plural = "Rails"
