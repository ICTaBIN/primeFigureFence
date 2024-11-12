from django.db import models

class ChainlinkBarbWire(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Barb Wire"
        verbose_name_plural = "Barb Wires"

class ChainlinkBraceBand(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    qtyPerTerminal = models.IntegerField()
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Brace Band"
        verbose_name_plural = "Brace Bands"

class ChainlinkConcrete(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Concrete"
        verbose_name_plural = "Concretes"

class ChainlinkHogTie(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Hog Tie"
        verbose_name_plural = "Hog Ties"

class ChainlinkLinePostCap(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Line Post Cap"
        verbose_name_plural = "Line Post Caps"

class ChainlinkLinePost(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Line Post"
        verbose_name_plural = "Line Posts"

class ChainlinkMesh(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Mesh"
        verbose_name_plural = "Meshes"

class ChainlinkTensionBand(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    qtyPerTerminal = models.IntegerField()
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Tension Band"
        verbose_name_plural = "Tension Bands"

class ChainlinkTensionBar(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.CharField(max_length=10)  # Width as string to accommodate fractions

    class Meta:
        verbose_name = "Tension Bar"
        verbose_name_plural = "Tension Bars"

class ChainlinkTensionWire(models.Model):
    length = models.IntegerField()  # Assuming length is in some unit
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Tension Wire"
        verbose_name_plural = "Tension Wires"

class ChainlinkTerminalCap(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Terminal Cap"
        verbose_name_plural = "Terminal Caps"

class ChainlinkTerminalPost(models.Model):
    fenceHeight = models.DecimalField(max_digits=3, decimal_places=0)
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Terminal Post"
        verbose_name_plural = "Terminal Posts"

class ChainlinkTopRail(models.Model):
    length = models.IntegerField()  # Assuming length is in some unit
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Top Rail"
        verbose_name_plural = "Top Rails"

class ChainlinkTopRailEnd(models.Model):
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.DecimalField(max_digits=3, decimal_places=3)  # Adjusted for decimal width

    class Meta:
        verbose_name = "Top Rail End"
        verbose_name_plural = "Top Rail Ends"

class ChainlinkTrussBar(models.Model):
    length = models.CharField(max_length=10)  # Length as string to accommodate fractions
    sku = models.CharField(max_length=20)
    name = models.CharField(max_length=255)  # User can enter any name
    price = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.CharField(max_length=10)  # Width as string to accommodate fractions

    class Meta:
        verbose_name = "Truss Bar"
        verbose_name_plural = "Truss Bars"

