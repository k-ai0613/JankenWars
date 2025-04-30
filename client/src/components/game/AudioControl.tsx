import React from 'react';
import { Button } from '../ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../lib/stores/useAudio';

export const AudioControl: React.FC = () => {
  const { muted, toggleMute } = useAudio();

  return (
    <Button
      onClick={toggleMute}
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 z-10"
      title={muted ? "Unmute sound" : "Mute sound"}
    >
      {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
    </Button>
  );
};