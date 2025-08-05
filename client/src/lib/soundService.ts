type SoundType = 'battle' | 'place' | 'victory' | 'background' | 'success' | 'hit';

class SoundService {
  private sounds: Record<SoundType, HTMLAudioElement>;
  private isMuted: boolean = false;
  private userInteracted: boolean = false; // ユーザーインタラクションフラグ

  constructor() {
    // 各種サウンドファイルの読み込み
    this.sounds = {
      // place.mp3 - 駒を置く音
      place: new Audio('/sounds/place.mp3'),
      
      // battle.mp3 - じゃんけん対決の音
      battle: new Audio('/sounds/battle.mp3'),
      
      // victory.mp3 - 勝利の音
      victory: new Audio('/sounds/victory.mp3'),
      
      // 他のサウンド。ボタン音として使用 (victory.mp3 を再利用)
      success: new Audio('/sounds/victory.mp3'), 
      
      // 他のサウンド。現在はフォールバックとして使用 (battle.mp3 を再利用)
      hit: new Audio('/sounds/battle.mp3'),
      
      // バックグラウンドミュージック（未使用）(victory.mp3 を再利用)
      background: new Audio('/sounds/victory.mp3')
    };
    
    // 全てのサウンドのボリュームを設定
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.5;
    });
  }

  // ユーザーがインタラクションしたことを記録し、オーディオをアンロックする試み
  userHasInteracted(): void {
    if (this.userInteracted) return;
    this.userInteracted = true;
    // 無音の短いオーディオを再生してコンテキストをアンロックする（iOS対策など）
    const unlockAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    unlockAudio.volume = 0.001; // ほぼ無音
    unlockAudio.play().catch(() => {
      // ここでのエラーは無視しても良いが、開発中はログ出しても良い
      // console.warn('[SoundService] Audio unlock attempt failed silently.');
    });
    console.log('[SoundService] User has interacted. Audio context likely unlocked.');
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundType): void {
    if (this.isMuted) return;
    if (!this.userInteracted) {
      // console.warn(`[SoundService] Playback prevented: User has not interacted with the document yet. Call userHasInteracted() first.`);
      return;
    }
    
    try {
      const audio = this.sounds[sound];
      if (audio) {
        // 再生直前のAudio要素の状態をログに出力
        // console.log(`[SoundService] Attempting to play: ${sound}`);
        // console.log(`[SoundService] Audio src: ${audio.src}`);
        // console.log(`[SoundService] Audio readyState: ${audio.readyState}`); // 0:HAVE_NOTHING, 1:HAVE_METADATA, 2:HAVE_CURRENT_DATA, 3:HAVE_FUTURE_DATA, 4:HAVE_ENOUGH_DATA
        // console.log(`[SoundService] Audio networkState: ${audio.networkState}`); // 0:NETWORK_EMPTY, 1:NETWORK_IDLE, 2:NETWORK_LOADING, 3:NETWORK_NO_SOURCE
        // console.log(`[SoundService] Audio error:`, audio.error);

        audio.currentTime = 0; // Reset to start
        audio.play().catch(e => {
          console.error(`Error playing sound ${sound}:`, e);
          // エラーオブジェクトの詳細を出力
          // console.error('Detailed audio play error:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
        });
      } else {
        console.error(`[SoundService] Audio object not found for sound type: ${sound}`);
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