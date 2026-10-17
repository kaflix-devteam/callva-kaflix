/**
 * Plays base64 WAV replies through a `<audio>` element.
 *
 * The element is passed in (rendered by the panel) so it lives in the DOM —
 * handy for tests (`duration > 0`) and so Safari keeps the user-gesture token.
 * One playback at a time: a new `play()` or `stop()` cancels the previous one.
 */
import { base64ToBlob } from './wav'

export type PlayerState = 'idle' | 'playing'

export class WavPlayer {
  private el: HTMLAudioElement
  private url: string | null = null
  private settle: (() => void) | null = null
  private cleanup: (() => void) | null = null
  onstate: ((state: PlayerState) => void) | null = null

  constructor(el: HTMLAudioElement) {
    this.el = el
  }

  get playing(): boolean {
    return this.settle !== null
  }

  /**
   * Call synchronously inside a user gesture (before any await): Safari unlocks
   * an <audio> element per gesture, and the greeting is played only after the
   * TTS fetch resolves. Harmless elsewhere.
   */
  prime(): void {
    try {
      this.el.muted = false
      this.el.load()
    } catch {
      /* ignore */
    }
  }

  /**
   * Resolves when playback ends (or is stopped). Rejects only if the browser
   * refuses to play (autoplay policy / unsupported data) or decoding fails.
   */
  play(base64: string, mime = 'audio/wav'): Promise<void> {
    this.stop()
    const el = this.el
    const blob = base64ToBlob(base64, mime)
    const url = URL.createObjectURL(blob)
    this.url = url

    return new Promise<void>((resolve, reject) => {
      let done = false
      const finish = (err?: Error) => {
        if (done) return
        done = true
        this.cleanup?.()
        this.cleanup = null
        this.settle = null
        this.revoke()
        this.onstate?.('idle')
        if (err) reject(err)
        else resolve()
      }
      const onEnded = () => finish()
      const onError = () => finish(new Error('음성을 재생하지 못했습니다.'))
      el.addEventListener('ended', onEnded)
      el.addEventListener('error', onError)
      this.cleanup = () => {
        el.removeEventListener('ended', onEnded)
        el.removeEventListener('error', onError)
      }
      this.settle = () => finish()

      el.src = url
      this.onstate?.('playing')
      el.play().catch((err: unknown) => {
        const message = err instanceof Error && err.name === 'NotAllowedError'
          ? '브라우저가 자동 재생을 막았습니다. 화면을 한 번 클릭한 뒤 다시 시도해 주세요.'
          : '음성을 재생하지 못했습니다.'
        finish(new Error(message))
      })
    })
  }

  /** Stop current playback (resolves the pending promise) and release the Blob URL. */
  stop(): void {
    const el = this.el
    const wasPlaying = this.settle !== null
    try {
      el.pause()
      el.currentTime = 0
    } catch {
      /* element may be detached */
    }
    if (wasPlaying) {
      this.settle?.()
    } else {
      this.revoke()
    }
    if (el.getAttribute('src')) el.removeAttribute('src')
  }

  private revoke() {
    if (this.url) {
      URL.revokeObjectURL(this.url)
      this.url = null
    }
  }
}
