/**
 * Mic capture for the live-call demo. Two ways to use it:
 *
 *  hold-to-talk (legacy API)        hands-free (continuous)
 *  ───────────────────────────      ────────────────────────────────────────────
 *  await start()                    await open({ preRollMs })  → stream open, levels flow via onLevel
 *  const rec = stop()               pause() / resume()         → gate processing (e.g. while the AI speaks)
 *  cancel()                         beginCapture()             → buffers (seeded with pre-roll)
 *                                   const rec = endCapture()   → mic stays open
 *                                   close()                    → release tracks, keep AudioContext
 *
 * The stream is opened once per call and kept open (one permission prompt); only
 * close()/dispose() stop the tracks. start()/stop()/cancel() never close it.
 *
 * Samples are collected via a ScriptProcessorNode (deprecated but universal; fine
 * for a ≤ 15 s demo clip). `onLevel(rms, timeSec)` gets one call per chunk with
 * the AUDIO clock (samples / sampleRate since open) — use that for VAD timing.
 * Handles Safari's `webkitAudioContext` and the `suspended` state.
 */
import { rms } from './wav'

export interface Recording {
  samples: Float32Array
  sampleRate: number
  /** samples / sampleRate (includes pre-roll when captured hands-free) */
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

const CONSTRAINTS: MediaStreamConstraints = {
  audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  video: false,
}

export class MicRecorder {
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private sink: GainNode | null = null

  private capturing = false
  private paused = false
  private chunks: Float32Array[] = []
  private length = 0

  private ring: Float32Array[] = []
  private ringLength = 0
  private ringMax = 0
  private elapsedSamples = 0

  /** One call per audio chunk: RMS of the chunk + audio-clock time (seconds since open). */
  onLevel: ((rms: number, timeSec: number) => void) | null = null

  get isOpen(): boolean {
    return this.stream !== null
  }

  get isCapturing(): boolean {
    return this.capturing
  }

  /** true → input is ignored (no levels, no pre-roll, no capture) */
  get isPaused(): boolean {
    return this.paused
  }

  /** @deprecated alias kept for the hold-to-talk code path */
  get recording(): boolean {
    return this.capturing
  }

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 48000
  }

  /** Create (synchronously, inside a user gesture) and resume the AudioContext. */
  private ensureContext(): AudioContext {
    const Ctor = getAudioContextCtor()
    if (!Ctor) throw new Error('이 브라우저에서는 마이크를 사용할 수 없습니다.')
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new Ctor()
    const ctx = this.ctx
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* resumed on next gesture */
      })
    }
    return ctx
  }

  /**
   * Ask for mic permission and unlock the AudioContext without keeping the mic
   * open. Call it synchronously from the 통화 시작 click (before any await).
   */
  async prepare(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저에서는 마이크를 사용할 수 없습니다.')
    this.ensureContext()
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
    for (const track of stream.getTracks()) track.stop()
  }

  /** Open the mic and start emitting levels. Nothing is buffered until beginCapture(). */
  async open(options: { preRollMs?: number } = {}): Promise<void> {
    if (this.isOpen) return
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저에서는 마이크를 사용할 수 없습니다.')
    const ctx = this.ensureContext()
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
    if (this.isOpen) {
      // a concurrent open() won the race
      for (const track of stream.getTracks()) track.stop()
      return
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore */
      }
    }

    this.ringMax = Math.round(((options.preRollMs ?? 0) / 1000) * ctx.sampleRate)
    this.ring = []
    this.ringLength = 0
    this.elapsedSamples = 0
    this.chunks = []
    this.length = 0
    this.capturing = false
    this.paused = false

    this.stream = stream
    this.source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    // A muted sink keeps the processor alive without echoing the mic to the speakers.
    const sink = ctx.createGain()
    sink.gain.value = 0
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      this.elapsedSamples += input.length
      if (this.paused) return
      const copy = new Float32Array(input.length)
      copy.set(input)
      if (this.capturing) {
        this.chunks.push(copy)
        this.length += copy.length
      } else if (this.ringMax > 0) {
        this.ring.push(copy)
        this.ringLength += copy.length
        while (this.ring.length > 1 && this.ringLength - (this.ring[0]?.length ?? 0) >= this.ringMax) {
          this.ringLength -= this.ring.shift()?.length ?? 0
        }
      }
      this.onLevel?.(rms(copy), this.elapsedSamples / ctx.sampleRate)
    }
    this.source.connect(processor)
    processor.connect(sink)
    sink.connect(ctx.destination)
    this.processor = processor
    this.sink = sink
  }

  /** Ignore input (keeps the stream and its permission). Drops the pre-roll ring. */
  pause(): void {
    this.paused = true
    this.ring = []
    this.ringLength = 0
  }

  /** Process input again, starting with an empty pre-roll ring (no speaker tail leaks in). */
  resume(): void {
    this.ring = []
    this.ringLength = 0
    this.paused = false
  }

  /** Start buffering; seeds with the pre-roll ring so the first syllable is not clipped. */
  beginCapture(): void {
    if (!this.isOpen || this.capturing) return
    this.chunks = this.ring
    this.length = this.ringLength
    this.ring = []
    this.ringLength = 0
    this.capturing = true
  }

  /** Stop buffering and return what was captured. The mic stays open. */
  endCapture(): Recording {
    const sampleRate = this.sampleRate
    const samples = new Float32Array(this.length)
    let offset = 0
    for (const chunk of this.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    this.chunks = []
    this.length = 0
    this.capturing = false
    return { samples, sampleRate, seconds: samples.length / sampleRate }
  }

  /** Release the mic tracks (keeps the AudioContext for the next open()). */
  close(): void {
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
    this.capturing = false
    this.chunks = []
    this.length = 0
    this.ring = []
    this.ringLength = 0
  }

  /* ---------- hold-to-talk (legacy) ---------- */

  /** Must be called from a user gesture (pointerdown / keydown) the first time (permission). */
  async start(): Promise<void> {
    if (this.capturing) return
    await this.open({ preRollMs: 0 })
    this.resume()
    this.beginCapture()
  }

  /** Stop capture and return what was recorded. The stream stays open (paused). */
  stop(): Recording {
    const rec = this.endCapture()
    this.pause()
    return rec
  }

  /** Stop and discard. The stream stays open (paused). */
  cancel(): void {
    this.endCapture()
    this.pause()
  }

  /** Release the AudioContext too (on unmount). */
  async dispose(): Promise<void> {
    this.close()
    this.onLevel = null
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
