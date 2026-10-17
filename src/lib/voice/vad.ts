/**
 * Tiny RMS-based voice activity detector for the hands-free call mode.
 *
 * Fed one `(rms, timeSec)` pair per audio chunk. `timeSec` must come from the
 * audio clock (samples / sampleRate), not wall-clock, so a stalled main thread
 * cannot fabricate silences and the behaviour is deterministic in tests.
 *
 *   calibrating ──(calibrationSec)──▶ idle ──(rms ≥ thr for onsetSec)──▶ speaking
 *   speaking ──(rms < thr for hangoverSec, or maxSpeechSec)──▶ idle  (emits `end`)
 *
 * threshold = clamp(median(noise during calibration) × noiseMultiplier, minThreshold, maxThreshold)
 * If the measured noise floor is suspiciously high (≥ suspiciousNoise — someone was
 * already talking) the calibration is treated as contaminated and `fallbackThreshold`
 * (the previous cycle's value, or 0.02) is used instead. Pass `initialThreshold` to
 * skip calibration entirely and reuse a known threshold.
 */
export interface VadOptions {
  calibrationSec: number
  minThreshold: number
  maxThreshold: number
  noiseMultiplier: number
  onsetSec: number
  hangoverSec: number
  maxSpeechSec: number
  /** noise floor at/above this during calibration → contaminated → use fallbackThreshold */
  suspiciousNoise: number
  fallbackThreshold: number
  /** > 0 → start in `idle` with this threshold, no calibration */
  initialThreshold: number
}

export const DEFAULT_VAD_OPTIONS: VadOptions = {
  calibrationSec: 0.5,
  minThreshold: 0.01,
  maxThreshold: 0.08,
  noiseMultiplier: 3,
  onsetSec: 0.15,
  hangoverSec: 0.9,
  maxSpeechSec: 15,
  suspiciousNoise: 0.03,
  fallbackThreshold: 0.02,
  initialThreshold: 0,
}

export type VadState = 'calibrating' | 'idle' | 'speaking'

export type VadEvent =
  | { type: 'calibrated'; threshold: number; noise: number; contaminated: boolean }
  | { type: 'onset'; at: number }
  | { type: 'end'; at: number; startedAt: number; speechSec: number; peak: number; reason: 'silence' | 'max' }

export class Vad {
  readonly options: VadOptions
  state: VadState = 'calibrating'
  threshold = 0
  noise = 0

  private calibrationStart: number | null = null
  private calibrationSamples: number[] = []
  private aboveSince: number | null = null
  private speechStart = 0
  private lastAbove = 0
  private peak = 0

  constructor(options: Partial<VadOptions> = {}) {
    this.options = { ...DEFAULT_VAD_OPTIONS, ...options }
    if (this.options.initialThreshold > 0) {
      this.threshold = this.options.initialThreshold
      this.state = 'idle'
    }
  }

  /** Seconds of speech so far (0 when not speaking). */
  speechSecAt(t: number): number {
    return this.state === 'speaking' ? Math.max(0, t - this.speechStart) : 0
  }

  feed(rms: number, t: number): VadEvent | null {
    const o = this.options
    if (this.state === 'calibrating') {
      if (this.calibrationStart === null) this.calibrationStart = t
      this.calibrationSamples.push(rms)
      if (t - this.calibrationStart < o.calibrationSec) return null
      this.noise = median(this.calibrationSamples)
      const contaminated = this.noise >= o.suspiciousNoise
      this.threshold = contaminated
        ? o.fallbackThreshold
        : Math.min(o.maxThreshold, Math.max(o.minThreshold, this.noise * o.noiseMultiplier))
      this.calibrationSamples = []
      this.calibrationStart = null
      this.state = 'idle'
      this.aboveSince = null
      return { type: 'calibrated', threshold: this.threshold, noise: this.noise, contaminated }
    }

    if (this.state === 'idle') {
      if (rms >= this.threshold) {
        if (this.aboveSince === null) this.aboveSince = t
        if (t - this.aboveSince >= o.onsetSec) {
          this.state = 'speaking'
          this.speechStart = this.aboveSince
          this.lastAbove = t
          this.peak = rms
          this.aboveSince = null
          return { type: 'onset', at: this.speechStart }
        }
      } else {
        this.aboveSince = null
      }
      return null
    }

    // speaking
    if (rms > this.peak) this.peak = rms
    if (rms >= this.threshold) this.lastAbove = t
    if (t - this.speechStart >= o.maxSpeechSec) return this.finish(t, 'max')
    if (t - this.lastAbove >= o.hangoverSec) return this.finish(t, 'silence')
    return null
  }

  /** Back to idle without recalibrating (after a rejected utterance / before re-listening). */
  reset(): void {
    if (this.state === 'calibrating') {
      // calibration was interrupted → start it over on the next feed
      this.calibrationStart = null
      this.calibrationSamples = []
      return
    }
    this.state = 'idle'
    this.aboveSince = null
    this.peak = 0
  }

  private finish(t: number, reason: 'silence' | 'max'): VadEvent {
    const ev: VadEvent = {
      type: 'end',
      at: t,
      startedAt: this.speechStart,
      speechSec: Math.max(0, (reason === 'max' ? t : this.lastAbove) - this.speechStart),
      peak: this.peak,
      reason,
    }
    this.reset()
    return ev
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

/** RMS → 0..1 display level (log scale: 0.001 → 0, 0.01 → 0.4, 0.1 → 0.8). */
export function rmsToLevel(rms: number): number {
  const db = 20 * Math.log10(Math.max(rms, 1e-5))
  return Math.min(1, Math.max(0, (db + 60) / 50))
}
