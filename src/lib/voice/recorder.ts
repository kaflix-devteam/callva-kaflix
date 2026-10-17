/**
 * Mic capture for hold-to-talk. Collects Float32 chunks via a ScriptProcessorNode
 * (deprecated but universally supported and plenty for a 15 s demo clip).
 *
 * - mono, echo cancellation + noise suppression requested
 * - handles Safari's `webkitAudioContext` and the `suspended` state
 * - `stop()` returns the raw samples + the context's real sample rate; the
 *   caller resamples to 16 kHz with `encodeWav()`.
 */
import { rms } from './wav'

export interface Recording {
  samples: Float32Array
  sampleRate: number
  seconds: number
}

type AudioContextCtor = typeof AudioContext

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { webkitAudioContext?: AudioContextCtor }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

export function isRecorderSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    getAudioContextCtor() !== null
  )
}

export class MicRecorder {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private sink: GainNode | null = null
  private chunks: Float32Array[] = []
  private length = 0
  private startedAt = 0
  /** Level callback (0..1-ish RMS of the latest chunk) for a VU indicator. */
  onlevel: ((level: number) => void) | null = null

  get recording(): boolean {
    return this.processor !== null
  }

  /** Must be called from a user gesture (pointerdown / keydown) for permissions + autoplay rules. */
  async start(): Promise<void> {
    if (this.recording) return
    const Ctor = getAudioContextCtor()
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('이 브라우저에서는 마이크를 사용할 수 없습니다.')
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    })
    const ctx = this.ctx ?? new Ctor()
    this.ctx = ctx
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* resumed on next gesture */
      }
    }

    this.chunks = []
    this.length = 0
    this.stream = stream
    this.source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    // A muted sink keeps the processor alive without echoing the mic to the speakers.
    const sink = ctx.createGain()
    sink.gain.value = 0
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      const copy = new Float32Array(input.length)
      copy.set(input)
      this.chunks.push(copy)
      this.length += copy.length
      this.onlevel?.(rms(copy))
    }
    this.source.connect(processor)
    processor.connect(sink)
    sink.connect(ctx.destination)
    this.processor = processor
    this.sink = sink
    this.startedAt = performance.now()
  }

  /** Stop capture, release the mic, return what was recorded. */
  stop(): Recording {
    const sampleRate = this.ctx?.sampleRate ?? 48000
    const seconds = this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0
    this.teardownGraph()
    const samples = new Float32Array(this.length)
    let offset = 0
    for (const chunk of this.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    this.chunks = []
    this.length = 0
    return { samples, sampleRate, seconds }
  }

  /** Stop and discard. */
  cancel(): void {
    this.teardownGraph()
    this.chunks = []
    this.length = 0
  }

  /** Release the AudioContext too (on unmount). */
  async dispose(): Promise<void> {
    this.cancel()
    const ctx = this.ctx
    this.ctx = null
    if (ctx && ctx.state !== 'closed') {
      try {
        await ctx.close()
      } catch {
        /* ignore */
      }
    }
  }

  private teardownGraph() {
    if (this.processor) {
      this.processor.onaudioprocess = null
      try {
        this.processor.disconnect()
      } catch {
        /* ignore */
      }
      this.processor = null
    }
    if (this.sink) {
      try {
        this.sink.disconnect()
      } catch {
        /* ignore */
      }
      this.sink = null
    }
    if (this.source) {
      try {
        this.source.disconnect()
      } catch {
        /* ignore */
      }
      this.source = null
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop()
      this.stream = null
    }
    this.startedAt = 0
  }
}

/** Map getUserMedia failures to a Korean message + whether it was a permission denial. */
export function describeMicError(err: unknown): { message: string; denied: boolean } {
  const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return { message: '마이크 권한이 거부되어 텍스트로만 대화합니다.', denied: true }
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return { message: '사용할 수 있는 마이크를 찾지 못했습니다.', denied: true }
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return { message: '마이크를 다른 앱이 사용 중이거나 열 수 없습니다.', denied: false }
  }
  return { message: err instanceof Error && err.message ? err.message : '마이크를 시작하지 못했습니다.', denied: false }
}
