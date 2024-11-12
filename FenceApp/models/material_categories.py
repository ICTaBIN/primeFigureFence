from django.db import models
from .main_models import Material


class WoodFence(Material):
    concrete = models.ForeignKey('WoodFenceConcrete', on_delete=models.CASCADE)
    fasteners = models.ForeignKey('WoodFenceFasteners', on_delete=models.CASCADE)
    gates = models.ForeignKey('WoodFenceGates', on_delete=models.CASCADE)
    pickets = models.ForeignKey('WoodFencePickets', on_delete=models.CASCADE)
    posts = models.ForeignKey('WoodFencePosts', on_delete=models.CASCADE)
    rails = models.ForeignKey('WoodFenceRails', on_delete=models.CASCADE)


class IronFence(Material):
    panels = models.ForeignKey('IronFencePanel', on_delete=models.CASCADE, related_name='iron_fences')  # Reference to IronFencePanel model
    posts = models.ForeignKey('IronFencePost', on_delete=models.CASCADE, related_name='iron_fences')  # Reference to IronFencePost model
    gates = models.ForeignKey('IronFenceGate', on_delete=models.CASCADE, related_name='iron_fences')  # Reference to IronFenceGate model
    brackets = models.ForeignKey('IronFenceBracket', on_delete=models.CASCADE, related_name='iron_fences')  # Reference to IronFenceBracket model
    gate_hardware = models.ForeignKey('IronFenceGateHardware', on_delete=models.CASCADE, related_name='iron_fences')  # Reference to IronFenceGateHardware model


class ChainlinkFence(Material):
    barb_wire = models.ForeignKey('ChainlinkBarbWire', on_delete=models.CASCADE, related_name='chainlink_fences')
    brace_bands = models.ForeignKey('ChainlinkBraceBand', on_delete=models.CASCADE, related_name='chainlink_fences')
    concrete = models.ForeignKey('ChainlinkConcrete', on_delete=models.CASCADE, related_name='chainlink_fences')
    hog_ties = models.ForeignKey('ChainlinkHogTie', on_delete=models.CASCADE, related_name='chainlink_fences')
    line_post_caps = models.ForeignKey('ChainlinkLinePostCap', on_delete=models.CASCADE, related_name='chainlink_fences')
    line_posts = models.ForeignKey('ChainlinkLinePost', on_delete=models.CASCADE, related_name='chainlink_fences')
    mesh = models.ForeignKey('ChainlinkMesh', on_delete=models.CASCADE, related_name='chainlink_fences')
    tension_bands = models.ForeignKey('ChainlinkTensionBand', on_delete=models.CASCADE, related_name='chainlink_fences')
    tension_bars = models.ForeignKey('ChainlinkTensionBar', on_delete=models.CASCADE, related_name='chainlink_fences')
    tension_wire = models.ForeignKey('ChainlinkTensionWire', on_delete=models.CASCADE, related_name='chainlink_fences')
    terminal_caps = models.ForeignKey('ChainlinkTerminalCap', on_delete=models.CASCADE, related_name='chainlink_fences')
    terminal_posts = models.ForeignKey('ChainlinkTerminalPost', on_delete=models.CASCADE, related_name='chainlink_fences')
    top_rail = models.ForeignKey('ChainlinkTopRail', on_delete=models.CASCADE, related_name='chainlink_fences')
    top_rail_ends = models.ForeignKey('ChainlinkTopRailEnd', on_delete=models.CASCADE, related_name='chainlink_fences')
    truss_bars = models.ForeignKey('ChainlinkTrussBar', on_delete=models.CASCADE, related_name='chainlink_fences')


