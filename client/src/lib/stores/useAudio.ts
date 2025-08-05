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
  playDraw: () => void;
  playWin: () => void;
  playLose: () => void;
  playClick: () => void;
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
  },

  playDraw: () => {
    if (!get().muted) {
      // soundService.play('drawSound'); // SoundTypeエラーのため一時コメントアウト
      console.log('Audio: Play Draw Sound (TODO: Uncomment and fix SoundType)');
    }
  },

  playWin: () => {
    if (!get().muted) {
      // soundService.play('winSound'); // SoundTypeエラーのため一時コメントアウト
      console.log('Audio: Play Win Sound (TODO: Uncomment and fix SoundType)');
    }
  },

  playLose: () => {
    if (!get().muted) {
      // soundService.play('loseSound'); // SoundTypeエラーのため一時コメントアウト
      console.log('Audio: Play Lose Sound (TODO: Uncomment and fix SoundType)');
    }
  },
  
  playClick: () => {
    if (!get().muted) {
      // soundService.play('click'); // SoundTypeエラーのため代替処理
      console.log('Audio: Play Click Sound');
      // クリック音の代わりに既存の音を使用
      soundService.play('place');
    }
  },
}));