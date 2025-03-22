"use client"

import { Button } from "@/components/ui/button"
import type { NoteValue } from "@/lib/types"

interface NoteSelectorProps {
  selectedValue: NoteValue
  onSelectValue: (value: NoteValue) => void
}

export default function NoteSelector({ selectedValue, onSelectValue }: NoteSelectorProps) {
  // Extended range of notes
  const noteValues: NoteValue[] = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]

  // Map note names to more user-friendly display
  const noteDisplay: Record<string, string> = {
    C4: "C",
    D4: "D",
    E4: "E",
    F4: "F",
    G4: "G",
    A4: "A",
    B4: "B",
    C5: "C",
  }

  const noteOctave: Record<string, string> = {
    C4: "4",
    D4: "4",
    E4: "4",
    F4: "4",
    G4: "4",
    A4: "4",
    B4: "4",
    C5: "5",
  }

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {noteValues.map((value) => (
        <Button
          key={value}
          variant={selectedValue === value ? "default" : "outline"}
          onClick={() => onSelectValue(value)}
          className="h-16 flex flex-col items-center justify-center"
        >
          <span className="text-lg font-semibold">{noteDisplay[value]}</span>
          <span className="text-xs">Octave {noteOctave[value]}</span>
        </Button>
      ))}
    </div>
  )
}

