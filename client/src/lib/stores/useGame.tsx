import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export enum GamePhase {
  READY = "ready",
  PLAYING = "playing",
  ENDED = "ended"
}

interface GameState {
  phase: GamePhase;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: GamePhase.READY,
    
    start: () => {
      set((state) => {
        // Only transition from ready to playing
        if (state.phase === GamePhase.READY) {
          return { phase: GamePhase.PLAYING };
        }
        return {};
      });
    },
    
    restart: () => {
      set(() => ({ phase: GamePhase.READY }));
    },
    
    end: () => {
      set((state) => {
        // Only transition from playing to ended
        if (state.phase === GamePhase.PLAYING) {
          return { phase: GamePhase.ENDED };
        }
        return {};
      });
    }
  }))
);
