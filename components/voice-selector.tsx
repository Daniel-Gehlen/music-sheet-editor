"use client"

import { Button } from "@/components/ui/button"
import { Layers, Music } from "lucide-react"
import type { Voice } from "@/lib/types"

interface VoiceSelectorProps {
  selectedVoice: Voice
  onSelectVoice: (voice: Voice) => void
}

export default function VoiceSelector({ selectedVoice, onSelectVoice }: VoiceSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant={selectedVoice === "first" ? "default" : "outline"}
        onClick={() => onSelectVoice("first")}
        className="flex items-center justify-center py-6"
      >
        <div className="flex flex-col items-center">
          <Layers className="h-6 w-6 mb-2" />
          <span className="font-medium">First Voice</span>
          <span className="text-xs mt-1 text-muted-foreground">Primary melodic line</span>
        </div>
      </Button>

      <Button
        variant={selectedVoice === "second" ? "default" : "outline"}
        onClick={() => onSelectVoice("second")}
        className="flex items-center justify-center py-6"
      >
        <div className="flex flex-col items-center">
          <Music className="h-6 w-6 mb-2" />
          <span className="font-medium">Second Voice</span>
          <span className="text-xs mt-1 text-muted-foreground">Secondary melodic line</span>
        </div>
      </Button>
    </div>
  )
}

