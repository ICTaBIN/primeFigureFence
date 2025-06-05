"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type PricingConfig, defaultPricingConfigs } from "@/lib/pricing-config"

interface FenceData {
  segments: any[]
  gates: any[]
}

interface CalculationResult {
  materials: {
    posts: { quantity: number; cost: number }
    panels: { quantity: number; cost: number }
    gates: { quantity: number; cost: number }
    hardware: { quantity: number; cost: number }
  }
  labor: {
    hours: number
    cost: number
  }
  total: number
}

export default function PricingCalculator({
  fenceData,
  onCalculationComplete,
}: {
  fenceData: FenceData
  onCalculationComplete: (result: CalculationResult) => void
}) {
  const [calculations, setCalculations] = useState<CalculationResult | null>(null)
  const [pricingConfigs] = useState<PricingConfig[]>(defaultPricingConfigs)

  const calculateCosts = () => {
    if (!fenceData.segments.length) return

    const result: CalculationResult = {
      materials: {
        posts: { quantity: 0, cost: 0 },
        panels: { quantity: 0, cost: 0 },
        gates: { quantity: 0, cost: 0 },
        hardware: { quantity: 0, cost: 0 },
      },
      labor: { hours: 0, cost: 0 },
      total: 0,
    }

    // Group segments by fence type
    const segmentsByType = fenceData.segments.reduce(
      (acc, segment) => {
        if (!acc[segment.fenceType]) acc[segment.fenceType] = []
        acc[segment.fenceType].push(segment)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Calculate for each fence type
    Object.entries(segmentsByType).forEach(([fenceType, segments]) => {
      const config = pricingConfigs.find((c) => c.fenceType === fenceType)
      if (!config) return

      const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0)

      // Calculate posts
      const postCount = Math.ceil(totalLength / config.materials.posts.spacing) + 1
      result.materials.posts.quantity += postCount
      result.materials.posts.cost += postCount * config.materials.posts.price

      // Calculate panels
      const panelQuantity =
        config.materials.panels.unit === "linear_foot"
          ? totalLength
          : Math.ceil(totalLength / config.materials.posts.spacing)
      result.materials.panels.quantity += panelQuantity
      result.materials.panels.cost += panelQuantity * config.materials.panels.price

      // Calculate hardware
      result.materials.hardware.quantity += postCount
      result.materials.hardware.cost += postCount * config.materials.hardware.price

      // Calculate labor
      segments.forEach((segment) => {
        const heightMultiplier = config.labor.heightMultiplier[segment.height] || 1
        const styleMultiplier = config.labor.styleMultiplier[segment.style] || 1
        const laborHours = (segment.length / 10) * heightMultiplier * styleMultiplier // Base: 10ft per hour
        const laborCost = laborHours * config.labor.baseRate

        result.labor.hours += laborHours
        result.labor.cost += laborCost
      })
    })

    // Calculate gates
    fenceData.gates.forEach((gate) => {
      const config = pricingConfigs.find((c) => c.fenceType === gate.fenceType)
      if (config) {
        result.materials.gates.quantity += 1
        result.materials.gates.cost += config.materials.gates.price
      }
    })

    // Calculate total
    result.total =
      result.materials.posts.cost +
      result.materials.panels.cost +
      result.materials.gates.cost +
      result.materials.hardware.cost +
      result.labor.cost

    setCalculations(result)
    onCalculationComplete(result)
  }

  useEffect(() => {
    if (fenceData.segments.length > 0) {
      calculateCosts()
    }
  }, [fenceData])

  if (!calculations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Draw fence segments to see cost calculations</p>
          <Button onClick={calculateCosts} className="mt-4">
            Calculate Costs
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Materials</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Posts ({calculations.materials.posts.quantity})</span>
                <span>${calculations.materials.posts.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Panels ({calculations.materials.panels.quantity})</span>
                <span>${calculations.materials.panels.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gates ({calculations.materials.gates.quantity})</span>
                <span>${calculations.materials.gates.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware ({calculations.materials.hardware.quantity})</span>
                <span>${calculations.materials.hardware.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Labor</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Hours ({calculations.labor.hours.toFixed(1)})</span>
                <span>${calculations.labor.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Cost</span>
            <span>${calculations.total.toFixed(2)}</span>
          </div>
        </div>

        <Button onClick={calculateCosts} className="w-full">
          Recalculate
        </Button>
      </CardContent>
    </Card>
  )
}
