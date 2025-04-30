type SoundType = 'battle' | 'place' | 'victory' | 'background' | 'success' | 'hit';

class SoundService {
  private sounds: Record<SoundType, HTMLAudioElement>;
  private isMuted: boolean = false;

  constructor() {
    // 各種サウンドファイルの読み込み
    this.sounds = {
      // 剣で斬る3.mp3 - 駒を置く音
      place: new Audio('/剣で斬る3.mp3'),
      
      // 倒れる.mp3 - じゃんけん対決の音
      battle: new Audio('/倒れる.mp3'),
      
      // jingle_12.mp3 - 勝利の音
      victory: new Audio('/jingle_12.mp3'),
      
      // 他のサウンド。ボタン音として使用
      success: new Audio('/jingle_12.mp3'), 
      
      // 他のサウンド。現在はフォールバックとして使用
      hit: new Audio('/倒れる.mp3'),
      
      // バックグラウンドミュージック（未使用）
      background: new Audio('/jingle_12.mp3')
    };
    
    // 全てのサウンドのボリュームを設定
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.5;
    });
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundType): void {
    if (this.isMuted) return;
    
    try {
      const audio = this.sounds[sound];
      if (audio) {
        audio.currentTime = 0; // Reset to start
        audio.play().catch(e => console.error(`Error playing sound ${sound}:`, e));
      }
    } catch (error) {
      console.error(`Error playing sound ${sound}:`, error);
    }
  }

  /**
   * Stop a sound
   */
  stop(sound: SoundType): void {
    try {
      const audio = this.sounds[sound];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (error) {
      console.error(`Error stopping sound ${sound}:`, error);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    try {
      Object.values(this.sounds).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    } catch (error) {
      console.error('Error stopping all sounds:', error);
    }
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
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    }
    return this.isMuted;
  }
}

export const soundService = new SoundService();