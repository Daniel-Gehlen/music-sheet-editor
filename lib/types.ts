export type NoteType = "whole" | "half" | "quarter" | "eighth" | "sixteenth"
export type Voice = "first" | "second"
export type NoteValue =
  | "C3"
  | "D3"
  | "E3"
  | "F3"
  | "G3"
  | "A3"
  | "B3"
  | "C4"
  | "D4"
  | "E4"
  | "F4"
  | "G4"
  | "A4"
  | "B4"
  | "C5"
  | "D5"
  | "E5"
  | "F5"
  | "G5"
  | "A5"
  | "B5"

export interface Note {
  id: string
  type: NoteType
  value: string // Now accepts any note from C3 to C5
  position: {
    x: number
    y: number
  }
  voice: Voice
}

