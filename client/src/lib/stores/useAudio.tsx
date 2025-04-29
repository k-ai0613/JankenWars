import { create } from 'zustand';

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: false,
  
  setBackgroundMusic: (music: HTMLAudioElement) => {
    set({ backgroundMusic: music });
  },
  
  setHitSound: (sound: HTMLAudioElement) => {
    set({ hitSound: sound });
  },
  
  setSuccessSound: (sound: HTMLAudioElement) => {
    set({ successSound: sound });
  },
  
  toggleMute: () => {
    const { isMuted, backgroundMusic, hitSound, successSound } = get();
    
    // Toggle mute state
    set({ isMuted: !isMuted });
    
    // Update audio elements
    if (backgroundMusic) {
      backgroundMusic.muted = !isMuted;
    }
    
    if (hitSound) {
      hitSound.muted = !isMuted;
    }
    
    if (successSound) {
      successSound.muted = !isMuted;
    }
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      // Reset playback position and play the sound
      hitSound.currentTime = 0;
      hitSound.play().catch(err => {
        console.error('Failed to play hit sound:', err);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      // Reset playback position and play the sound
      successSound.currentTime = 0;
      successSound.play().catch(err => {
        console.error('Failed to play success sound:', err);
      });
    }
  }
}));
