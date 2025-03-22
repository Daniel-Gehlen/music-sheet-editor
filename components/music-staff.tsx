"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import type { Note, Voice } from "@/lib/types"

interface MusicStaffProps {
  notes: Note[]
  onAddNote: (position: { x: number; y: number }, noteValue: string) => void
  selectedVoice: Voice
}

export default function MusicStaff({ notes, onAddNote, selectedVoice }: MusicStaffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 300 }) // Increased height for more range

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement
        if (container) {
          setCanvasSize({
            width: container.clientWidth - 20,
            height: 300, // Increased height for more range
          })
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Draw the staff and notes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set line style
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1

    // Draw staff lines
    const lineSpacing = 10
    const startY = canvas.height / 2 - lineSpacing * 2

    for (let i = 0; i < 5; i++) {
      const y = startY + i * lineSpacing
      ctx.beginPath()
      ctx.moveTo(50, y)
      ctx.lineTo(canvas.width - 20, y)
      ctx.stroke()
    }

    // Draw treble clef
    ctx.font = "60px serif"
    ctx.fillText("𝄞", 10, startY + 35)

    // Draw notes
    notes.forEach((note) => {
      // Use different colors for different voices
      const voiceColor = note.voice === "first" ? "#000" : "#0066cc"
      drawNote(ctx, note, voiceColor)
    })
  }, [notes, canvasSize, selectedVoice])

  const drawNote = (ctx: CanvasRenderingContext2D, note: Note, color: string) => {
    const { position, type } = note
    const { x, y } = position

    // Staff parameters
    const lineSpacing = 10
    const startY = canvasSize.height / 2 - lineSpacing * 2
    const staffTop = startY
    const staffBottom = startY + 4 * lineSpacing

    // Draw ledger lines if needed
    if (y < staffTop || y > staffBottom) {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1

      // Ledger lines above the staff
      if (y < staffTop) {
        let ledgerY = staffTop - lineSpacing
        while (ledgerY >= y - lineSpacing / 2) {
          // Draw ledger line for every line position (not space)
          if (Math.abs((ledgerY - staffTop) % lineSpacing) < 0.1) {
            ctx.moveTo(x - 12, ledgerY)
            ctx.lineTo(x + 12, ledgerY)
          }
          ledgerY -= lineSpacing / 2
        }
      }

      // Ledger lines below the staff
      if (y > staffBottom) {
        let ledgerY = staffBottom + lineSpacing
        while (ledgerY <= y + lineSpacing / 2) {
          // Draw ledger line for every line position (not space)
          if (Math.abs((ledgerY - staffBottom) % lineSpacing) < 0.1) {
            ctx.moveTo(x - 12, ledgerY)
            ctx.lineTo(x + 12, ledgerY)
          }
          ledgerY += lineSpacing / 2
        }
      }

      ctx.stroke()
    }

    // Draw note head
    ctx.beginPath()
    if (type === "quarter" || type === "eighth" || type === "sixteenth") {
      ctx.fillStyle = color
    } else {
      ctx.fillStyle = "#fff"
      ctx.strokeStyle = color
    }

    ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    if (type === "whole" || type === "half") {
      ctx.stroke()
    }

    // Draw stem for notes that have them
    if (type !== "whole") {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.moveTo(x + 6, y)
      ctx.lineTo(x + 6, y - 30)
      ctx.stroke()
    }

    // Draw flags for eighth and sixteenth notes
    if (type === "eighth" || type === "sixteenth") {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.moveTo(x + 6, y - 30)
      ctx.quadraticCurveTo(x + 20, y - 25, x + 15, y - 15)
      ctx.stroke()

      if (type === "sixteenth") {
        ctx.beginPath()
        ctx.moveTo(x + 6, y - 22)
        ctx.quadraticCurveTo(x + 20, y - 17, x + 15, y - 7)
        ctx.stroke()
      }
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Snap Y position to nearest line or space
    const lineSpacing = 10
    const startY = canvas.height / 2 - lineSpacing * 2
    const relativeY = y - startY
    const lineIndex = Math.round(relativeY / (lineSpacing / 2)) * (lineSpacing / 2)
    const snappedY = startY + lineIndex

    // Only allow notes to be placed after the treble clef
    if (x > 50 && x < canvas.width - 20) {
      // Map Y position to note value
      const noteValue = yPositionToNote(snappedY, startY, lineSpacing)
      onAddNote({ x, y: snappedY }, noteValue)
    }
  }

  // Convert Y position to note value
  const yPositionToNote = (y: number, staffStartY: number, lineSpacing: number): string => {
    // Calculate how many half-steps from middle C (which is one ledger line below the staff)
    const middleCY = staffStartY + 5 * lineSpacing // Middle C position
    const halfStepsFromMiddleC = Math.round((middleCY - y) / (lineSpacing / 2))

    // Map half steps to note names
    const noteNames = [
      "C3",
      "D3",
      "E3",
      "F3",
      "G3",
      "A3",
      "B3",
      "C4",
      "D4",
      "E4",
      "F4",
      "G4",
      "A4",
      "B4",
      "C5",
      "D5",
      "E5",
      "F5",
      "G5",
      "A5",
      "B5",
    ]

    // Middle C is C4, which is at index 7 in our array
    const middleCIndex = 7
    const noteIndex = middleCIndex + halfStepsFromMiddleC

    // Ensure we stay within the range of our note names
    if (noteIndex < 0) return noteNames[0]
    if (noteIndex >= noteNames.length) return noteNames[noteNames.length - 1]

    return noteNames[noteIndex]
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onClick={handleCanvasClick}
      className="cursor-pointer"
    />
  )
}

