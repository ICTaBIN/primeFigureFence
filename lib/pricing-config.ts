export interface PricingConfig {
  fenceType: "wood" | "chainlink" | "wroughtiron"
  materials: {
    posts: { price: number; spacing: number }
    panels: { price: number; unit: "linear_foot" | "panel" }
    gates: { price: number }
    hardware: { price: number }
  }
  labor: {
    baseRate: number
    heightMultiplier: { [key: string]: number }
    styleMultiplier: { [key: string]: number }
  }
}

export const defaultPricingConfigs: PricingConfig[] = [
  {
    fenceType: "wood",
    materials: {
      posts: { price: 25, spacing: 8 },
      panels: { price: 15, unit: "linear_foot" },
      gates: { price: 150 },
      hardware: { price: 5 },
    },
    labor: {
      baseRate: 12,
      heightMultiplier: { "4ft": 1.0, "6ft": 1.3, "8ft": 1.6 },
      styleMultiplier: { basic: 1.0, decorative: 1.4, premium: 1.8 },
    },
  },
  {
    fenceType: "chainlink",
    materials: {
      posts: { price: 18, spacing: 10 },
      panels: { price: 8, unit: "linear_foot" },
      gates: { price: 120 },
      hardware: { price: 3 },
    },
    labor: {
      baseRate: 8,
      heightMultiplier: { "4ft": 1.0, "6ft": 1.2, "8ft": 1.4 },
      styleMultiplier: { basic: 1.0, galvanized: 1.2, "vinyl-coated": 1.3 },
    },
  },
  {
    fenceType: "wroughtiron",
    materials: {
      posts: { price: 45, spacing: 6 },
      panels: { price: 35, unit: "linear_foot" },
      gates: { price: 300 },
      hardware: { price: 12 },
    },
    labor: {
      baseRate: 20,
      heightMultiplier: { "4ft": 1.0, "6ft": 1.4, "8ft": 1.8 },
      styleMultiplier: { basic: 1.0, ornate: 1.6, custom: 2.2 },
    },
  },
]
