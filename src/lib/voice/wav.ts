/**
 * PCM → WAV (RIFF) encoder for the live-call demo.
 *
 * Browser mics usually run at 44.1/48 kHz; the ASR side wants 16 kHz mono
 * 16-bit PCM. We downsample ourselves (no resampling libs):
 *   - ratio > 1 (down): box-average every `ratio` input samples → cheap
 *     anti-aliasing, good enough for speech.
 *   - ratio < 1 (up):   linear interpolation (rare; kept for completeness).
 *
 * Self-check (run with `node --experimental-strip-types` or any TS runner):
 *   const sr = 48000, s = new Float32Array(sr)                 // 1 s sine
 *   for (let i = 0; i < sr; i++) s[i] = Math.sin((2 * Math.PI * 440 * i) / sr)
 *   const buf = encodeWav(s, sr)                                  // → 44 + 16000*2 bytes
 *   const v = new DataView(buf)
 *   v.getUint16(22, true) === 1       // mono
 *   v.getUint32(24, true) === 16000   // sample rate
 *   v.getUint16(34, true) === 16      // bits per sample
 *   v.getUint32(40, true) === 32000   // data chunk byte length
 */

export const WAV_TARGET_RATE = 16000

/** Downsample/upsample a mono Float32 signal to `targetRate`. */
export function resampleLinear(samples: Float32Array, inputRate: number, targetRate: number): Float32Array {
  if (inputRate === targetRate || samples.length === 0) return samples
  const ratio = inputRate / targetRate
  const outLength = Math.max(1, Math.floor(samples.length / ratio))
  const out = new Float32Array(outLength)

  if (ratio > 1) {
    // Box filter: average the window of input samples that maps onto each output sample.
    let inPos = 0
    for (let i = 0; i < outLength; i++) {
      const nextPos = Math.min(samples.length, Math.round((i + 1) * ratio))
      let sum = 0
      let count = 0
      for (let j = inPos; j < nextPos; j++) {
        sum += samples[j] ?? 0
        count++
      }
      out[i] = count > 0 ? sum / count : (samples[inPos] ?? 0)
      inPos = nextPos
    }
    return out
  }

  // Upsampling: linear interpolation between neighbouring input samples.
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio
    const idx = Math.floor(pos)
    const frac = pos - idx
    const a = samples[idx] ?? 0
    const b = samples[Math.min(idx + 1, samples.length - 1)] ?? a
    out[i] = a + (b - a) * frac
  }
  return out
}

/** Encode mono Float32 samples as a 16-bit PCM WAV file at `targetRate`. */
export function encodeWav(samples: Float32Array, inputRate: number, targetRate = WAV_TARGET_RATE): ArrayBuffer {
  const pcm = resampleLinear(samples, inputRate, targetRate)
  const bytesPerSample = 2
  const dataLength = pcm.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size (PCM)
  view.setUint16(20, 1, true) // audio format = PCM
  view.setUint16(22, 1, true) // channels = mono
  view.setUint32(24, targetRate, true)
  view.setUint32(28, targetRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < pcm.length; i++, offset += bytesPerSample) {
    const s = Math.max(-1, Math.min(1, pcm[i] ?? 0))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

/** ArrayBuffer → base64 (chunked so large recordings don't blow the call stack). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)))
  }
  return btoa(binary)
}

/** base64 → Blob (used by the player for data returned as JSON). */
export function base64ToBlob(base64: string, mime = 'audio/wav'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Peak-normalised RMS of a chunk — used for the mic level indicator. */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i] ?? 0
    sum += v * v
  }
  return Math.sqrt(sum / samples.length)
}
