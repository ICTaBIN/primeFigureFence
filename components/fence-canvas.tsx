"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Undo2, Redo2, Grid, Move, Square, Circle, Trash2 } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface FenceSegment {
  id: string
  start: Point
  end: Point
  length: number
  fenceType: "wood" | "chainlink" | "wroughtiron"
  height: string
  style: string
}

interface Gate {
  id: string
  position: Point
  width: number
  fenceType: "wood" | "chainlink" | "wroughtiron"
}

export default function FenceCanvas({ onDataChange }: { onDataChange: (data: any) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"line" | "gate" | "move">("line")
  const [showGrid, setShowGrid] = useState(true)
  const [segments, setSegments] = useState<FenceSegment[]>([])
  const [gates, setGates] = useState<Gate[]>([])
  const [currentSegment, setCurrentSegment] = useState<Point | null>(null)
  const [selectedFenceType, setSelectedFenceType] = useState<"wood" | "chainlink" | "wroughtiron">("wood")
  const [selectedHeight, setSelectedHeight] = useState("6ft")
  const [selectedStyle, setSelectedStyle] = useState("basic")
  const [scale, setScale] = useState(1) // pixels per foot
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveToHistory = useCallback(() => {
    const state = { segments, gates }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [segments, gates, history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setSegments(prevState.segments)
      setGates(prevState.gates)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setSegments(nextState.segments)
      setGates(nextState.gates)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return

    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    const gridSize = 20 * scale // 20 pixels per foot at scale 1

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  const drawSegments = (ctx: CanvasRenderingContext2D) => {
    segments.forEach((segment) => {
      ctx.strokeStyle =
        segment.fenceType === "wood" ? "#8b4513" : segment.fenceType === "chainlink" ? "#708090" : "#2f4f4f"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(segment.start.x, segment.start.y)
      ctx.lineTo(segment.end.x, segment.end.y)
      ctx.stroke()

      // Draw length label
      const midX = (segment.start.x + segment.end.x) / 2
      const midY = (segment.start.y + segment.end.y) / 2
      ctx.fillStyle = "#000"
      ctx.font = "12px Arial"
      ctx.fillText(`${segment.length.toFixed(1)}ft`, midX, midY - 5)
    })
  }

  const drawGates = (ctx: CanvasRenderingContext2D) => {
    gates.forEach((gate) => {
      ctx.fillStyle = "#ff6b6b"
      ctx.fillRect(gate.position.x - 10, gate.position.y - 10, 20, 20)
      ctx.fillStyle = "#000"
      ctx.font = "10px Arial"
      ctx.fillText("G", gate.position.x - 4, gate.position.y + 3)
    })
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas)
    drawSegments(ctx)
    drawGates(ctx)

    if (currentSegment && tool === "line") {
      ctx.strokeStyle = "#666"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(currentSegment.x, currentSegment.y)
      // This would be connected to mouse position in a real implementation
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [segments, gates, currentSegment, tool, showGrid, scale])

  useEffect(() => {
    redraw()
  }, [redraw])

  useEffect(() => {
    onDataChange({ segments, gates })
  }, [segments, gates, onDataChange])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "line") {
      if (!currentSegment) {
        setCurrentSegment({ x, y })
      } else {
        const length = Math.sqrt(Math.pow(x - currentSegment.x, 2) + Math.pow(y - currentSegment.y, 2)) / scale
        const newSegment: FenceSegment = {
          id: Date.now().toString(),
          start: currentSegment,
          end: { x, y },
          length,
          fenceType: selectedFenceType,
          height: selectedHeight,
          style: selectedStyle,
        }
        setSegments((prev) => [...prev, newSegment])
        setCurrentSegment(null)
        saveToHistory()
      }
    } else if (tool === "gate") {
      const newGate: Gate = {
        id: Date.now().toString(),
        position: { x, y },
        width: 4, // Default 4ft gate
        fenceType: selectedFenceType,
      }
      setGates((prev) => [...prev, newGate])
      saveToHistory()
    }
  }

  const clearCanvas = () => {
    setSegments([])
    setGates([])
    setCurrentSegment(null)
    saveToHistory()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fence Layout Designer</CardTitle>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Button variant={tool === "line" ? "default" : "outline"} size="sm" onClick={() => setTool("line")}>
              <Square className="w-4 h-4 mr-1" />
              Draw Fence
            </Button>
            <Button variant={tool === "gate" ? "default" : "outline"} size="sm" onClick={() => setTool("gate")}>
              <Circle className="w-4 h-4 mr-1" />
              Add Gate
            </Button>
            <Button variant={tool === "move" ? "default" : "outline"} size="sm" onClick={() => setTool("move")}>
              <Move className="w-4 h-4 mr-1" />
              Move
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <Label htmlFor="fence-type">Fence Type</Label>
            <Select value={selectedFenceType} onValueChange={(value: any) => setSelectedFenceType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wood">Wood</SelectItem>
                <SelectItem value="chainlink">Chain Link</SelectItem>
                <SelectItem value="wroughtiron">Wrought Iron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="height">Height</Label>
            <Select value={selectedHeight} onValueChange={setSelectedHeight}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4ft">4ft</SelectItem>
                <SelectItem value="6ft">6ft</SelectItem>
                <SelectItem value="8ft">8ft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="style">Style</Label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedFenceType === "wood" && (
                  <>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="decorative">Decorative</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </>
                )}
                {selectedFenceType === "chainlink" && (
                  <>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="galvanized">Galvanized</SelectItem>
                    <SelectItem value="vinyl-coated">Vinyl Coated</SelectItem>
                  </>
                )}
                {selectedFenceType === "wroughtiron" && (
                  <>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="ornate">Ornate</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scale">Scale (px/ft)</Label>
            <Input
              type="number"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-20"
              min="0.5"
              max="5"
              step="0.1"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-gray-300 cursor-crosshair bg-white"
          onClick={handleCanvasClick}
        />

        <div className="mt-4 text-sm text-gray-600">
          <p>Total Segments: {segments.length}</p>
          <p>Total Gates: {gates.length}</p>
          <p>Total Linear Feet: {segments.reduce((sum, seg) => sum + seg.length, 0).toFixed(1)}ft</p>
        </div>
      </CardContent>
    </Card>
  )
}
