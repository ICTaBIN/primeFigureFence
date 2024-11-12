from django.db import models

class IronFencePanel(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=0)
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    railCount = models.IntegerField()

    class Meta:
        verbose_name = "Panel"
        verbose_name_plural = "Panels"

class IronFencePost(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=0)
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)

    class Meta:
        verbose_name = "Post"
        verbose_name_plural = "Posts"

class IronFenceBracket(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.IntegerField()

    class Meta:
        verbose_name = "Bracket"
        verbose_name_plural = "Brackets"

class IronFenceGate(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=0)
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    railCount = models.IntegerField()

    class Meta:
        verbose_name = "Gate"
        verbose_name_plural = "Gates"

class IronFenceGateHardware(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=1000)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Gate Hardware"
        verbose_name_plural = "Gate Hardware"

