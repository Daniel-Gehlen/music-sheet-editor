"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Play, Square, Trash2, Music, Save } from "lucide-react"
import MusicStaff from "@/components/music-staff"
import VoiceSelector from "@/components/voice-selector"
import type { Note, NoteType, Voice } from "@/lib/types"

export default function MusicSheetEditor() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<NoteType>("quarter")
  const [selectedVoice, setSelectedVoice] = useState<Voice>("first")
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const staffRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      document.removeEventListener("click", initAudioContext)
    }

    document.addEventListener("click", initAudioContext)

    return () => {
      document.removeEventListener("click", initAudioContext)
      audioContextRef.current?.close()
    }
  }, [])

  const addNote = (position: { x: number; y: number }, noteValue: string) => {
    // Check if there's already a note with the same value at this position and voice
    const existingNoteWithSameValue = notes.find(
      (note) =>
        Math.abs(note.position.x - position.x) < 10 &&
        Math.abs(note.position.y - position.y) < 5 &&
        note.value === noteValue &&
        note.voice === selectedVoice,
    )

    // If there's already a note with the same value at this position and voice, don't add another
    if (existingNoteWithSameValue) return

    const newNote: Note = {
      id: Date.now().toString(),
      type: selectedNote,
      value: noteValue,
      position,
      voice: selectedVoice,
    }

    setNotes([...notes, newNote])
  }

  const clearNotes = () => {
    setNotes([])
  }

  const playComposition = async () => {
    if (!audioContextRef.current) return

    setIsPlaying(true)

    const ctx = audioContextRef.current

    // Group notes by their x-position to identify chords
    const notesByPosition: Record<number, Note[]> = {}
    notes.forEach((note) => {
      // Round x position to nearest 5px to group notes that are close together
      const xPos = Math.round(note.position.x / 5) * 5
      if (!notesByPosition[xPos]) {
        notesByPosition[xPos] = []
      }
      notesByPosition[xPos].push(note)
    })

    // Sort positions to play notes in order from left to right
    const positions = Object.keys(notesByPosition)
      .map(Number)
      .sort((a, b) => a - b)

    // Note durations in seconds
    const durations: Record<NoteType, number> = {
      whole: 2.0,
      half: 1.0,
      quarter: 0.5,
      eighth: 0.25,
      sixteenth: 0.125,
    }

    // Play each position (chord or single note) sequentially
    for (const position of positions) {
      const notesAtPosition = notesByPosition[position]
      const oscillators: OscillatorNode[] = []
      const gainNodes: GainNode[] = []

      // Create oscillators for all notes in the chord
      for (const note of notesAtPosition) {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = "sine"

        // Map note value to frequency - extended range from C3 to C5
        const noteToFreq: Record<string, number> = {
          C3: 130.81,
          D3: 146.83,
          E3: 164.81,
          F3: 174.61,
          G3: 196.0,
          A3: 220.0,
          B3: 246.94,
          C4: 261.63,
          D4: 293.66,
          E4: 329.63,
          F4: 349.23,
          G4: 392.0,
          A4: 440.0,
          B4: 493.88,
          C5: 523.25,
          D5: 587.33,
          E5: 659.25,
          F5: 698.46,
          G5: 783.99,
          A5: 880.0,
          B5: 987.77,
        }

        oscillator.frequency.value = noteToFreq[note.value]

        gainNode.gain.value = 0.3 // Lower gain for chords to prevent clipping

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillators.push(oscillator)
        gainNodes.push(gainNode)
      }

      // Get the duration from the first note (assuming all notes in a chord have the same duration)
      const duration = durations[notesAtPosition[0].type]

      // Start all oscillators simultaneously for the chord
      oscillators.forEach((osc, i) => {
        osc.start()

        // Create envelope
        gainNodes[i].gain.setValueAtTime(0, ctx.currentTime)
        gainNodes[i].gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
        gainNodes[i].gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
      })

      // Wait for note duration
      await new Promise((resolve) => setTimeout(resolve, duration * 1000))

      // Stop all oscillators
      oscillators.forEach((osc) => osc.stop())
    }

    setIsPlaying(false)
  }

  const downloadAsImage = () => {
    if (!staffRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = staffRef.current.offsetWidth
    canvas.height = staffRef.current.offsetHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Use html2canvas or similar library to capture the staff
    // For this example, we'll create a simple representation
    ctx.fillStyle = "black"
    ctx.font = "16px Arial"
    ctx.fillText("Music Sheet Composition", 20, 30)

    // Draw staff lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(20, 60 + i * 10)
      ctx.lineTo(canvas.width - 20, 60 + i * 10)
      ctx.stroke()
    }

    // Draw treble clef (simplified)
    ctx.font = "60px serif"
    ctx.fillText("𝄞", 25, 85)

    // Draw notes (simplified)
    notes.forEach((note, index) => {
      const x = 100 + index * 40
      const y = note.position.y

      ctx.beginPath()
      if (note.type === "quarter" || note.type === "eighth" || note.type === "sixteenth") {
        ctx.fillStyle = "black"
      } else {
        ctx.fillStyle = "white"
        ctx.strokeStyle = "black"
      }

      // Draw note head
      ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      if (note.type === "whole" || note.type === "half") {
        ctx.stroke()
      }

      // Draw stem for notes that have them
      if (note.type !== "whole") {
        ctx.beginPath()
        ctx.moveTo(x + 6, y)
        ctx.lineTo(x + 6, y - 30)
        ctx.stroke()
      }
    })

    // Create download link
    const link = document.createElement("a")
    link.download = "music-composition.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const downloadAsMP3 = async () => {
    if (!audioContextRef.current) return

    // This is a simplified version - in a real app, you would use a library
    // like Tone.js or recorder.js to properly record and encode audio
    alert("MP3 download functionality would require additional audio processing libraries.")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Music Sheet Editor</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Staff</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearNotes} title="Clear all notes">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsImage} title="Save as image">
              <Save className="h-4 w-4 mr-1" />
              Save Image
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsMP3} title="Download as MP3">
              <Download className="h-4 w-4 mr-1" />
              MP3
            </Button>
            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              onClick={isPlaying ? () => setIsPlaying(false) : playComposition}
              disabled={notes.length === 0}
              title={isPlaying ? "Stop playing" : "Play composition"}
            >
              {isPlaying ? <Square className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? "Stop" : "Play"}
            </Button>
          </div>
        </div>

        <div ref={staffRef} className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
          <MusicStaff notes={notes} onAddNote={addNote} selectedVoice={selectedVoice} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <Tabs defaultValue="durations">
          <TabsList className="mb-4">
            <TabsTrigger value="durations">Note Durations</TabsTrigger>
            <TabsTrigger value="voices">Voices</TabsTrigger>
          </TabsList>

          <TabsContent value="durations">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(["whole", "half", "quarter", "eighth", "sixteenth"] as NoteType[]).map((type) => (
                <Button
                  key={type}
                  variant={selectedNote === type ? "default" : "outline"}
                  onClick={() => setSelectedNote(type)}
                  className="flex flex-col items-center py-3"
                >
                  <Music className="h-5 w-5 mb-1" />
                  <span className="text-xs capitalize">{type}</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="voices">
            <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

