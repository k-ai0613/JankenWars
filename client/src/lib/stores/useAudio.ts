import { create } from 'zustand';
import { soundService } from '../soundService';

interface AudioState {
  muted: boolean;
  toggleMute: () => void;
  playBattle: () => void;
  playPlace: () => void;
  playVictory: () => void;
  playBackground: () => void;
  playSuccess: () => void;
  playHit: () => void;
  stopAllSounds: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  muted: false,
  
  toggleMute: () => {
    const newMutedState = !get().muted;
    soundService.setMuted(newMutedState);
    set({ muted: newMutedState });
  },
  
  playBattle: () => {
    if (!get().muted) {
      soundService.play('battle');
    }
  },
  
  playPlace: () => {
    if (!get().muted) {
      soundService.play('place');
    }
  },
  
  playVictory: () => {
    if (!get().muted) {
      soundService.play('victory');
    }
  },
  
  playBackground: () => {
    if (!get().muted) {
      soundService.play('background');
    }
  },
  
  playSuccess: () => {
    if (!get().muted) {
      soundService.play('success');
    }
  },
  
  playHit: () => {
    if (!get().muted) {
      soundService.play('hit');
    }
  },
  
  stopAllSounds: () => {
    soundService.stopAll();
  }
}));