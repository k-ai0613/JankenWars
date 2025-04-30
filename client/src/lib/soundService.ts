type SoundType = 'battle' | 'place' | 'victory' | 'background' | 'success' | 'hit';

class SoundService {
  private sounds: Record<SoundType, HTMLAudioElement>;
  private isMuted: boolean = false;
  
  constructor() {
    this.sounds = {
      battle: new Audio('/sounds/battle.mp3'),     // じゃんけん勝敗が付いたとき
      place: new Audio('/sounds/place.mp3'),       // 駒を置いたとき
      victory: new Audio('/sounds/victory.mp3'),   // 勝利したとき
      background: new Audio('/sounds/background.mp3'), // BGM
      success: new Audio('/sounds/success.mp3'),   // 特殊駒を置いたとき
      hit: new Audio('/sounds/hit.mp3')            // エラー/警告
    };
    
    // Set volumes
    this.sounds.battle.volume = 0.5;
    this.sounds.place.volume = 0.3;
    this.sounds.victory.volume = 0.7;
    this.sounds.background.volume = 0.2;
    this.sounds.success.volume = 0.4;
    this.sounds.hit.volume = 0.4;
    
    // Loop background music
    this.sounds.background.loop = true;
  }
  
  /**
   * Play a sound effect
   */
  play(sound: SoundType): void {
    if (this.isMuted) return;
    
    try {
      // If already playing, reset and play again
      const audio = this.sounds[sound];
      audio.currentTime = 0;
      
      // For background music, only play if not already playing
      if (sound === 'background' && !audio.paused) {
        return;
      }
      
      audio.play().catch(err => {
        console.warn(`Failed to play sound ${sound}:`, err);
      });
    } catch (error) {
      console.error(`Error playing ${sound} sound:`, error);
    }
  }
  
  /**
   * Stop a sound
   */
  stop(sound: SoundType): void {
    try {
      const audio = this.sounds[sound];
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.error(`Error stopping ${sound} sound:`, error);
    }
  }
  
  /**
   * Stop all sounds
   */
  stopAll(): void {
    Object.values(this.sounds).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
  
  /**
   * Mute/unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    if (muted) {
      this.stopAll();
    }
  }
  
  /**
   * Get current mute state
   */
  getMuted(): boolean {
    return this.isMuted;
  }
  
  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}

// Create a singleton instance
export const soundService = new SoundService();