/**
 * Decode recorded WebM/Opus (or Ogg) from MediaRecorder to 16 kHz mono PCM WAV for Azure STT.
 */

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * @param {Float32Array} samples
 * @param {number} sampleRate
 * @returns {ArrayBuffer}
 */
export function encodeWavFromFloat32(samples, sampleRate) {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, n * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    const s16 = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
    view.setInt16(o, s16, true);
    o += 2;
  }
  return buffer;
}

function resampleLinear(input, inRate, outRate) {
  if (inRate === outRate) return input;
  const outLen = Math.max(1, Math.ceil((input.length * outRate) / inRate));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = (i * inRate) / outRate;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = srcPos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function toMono(audioBuffer) {
  const len = audioBuffer.length;
  const ch0 = audioBuffer.getChannelData(0);
  if (audioBuffer.numberOfChannels === 1) return new Float32Array(ch0);
  const ch1 = audioBuffer.getChannelData(1);
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    mono[i] = (ch0[i] + ch1[i]) * 0.5;
  }
  return mono;
}

/**
 * @param {Blob} blob
 * @returns {Promise<ArrayBuffer>} WAV bytes at 16 kHz mono PCM
 */
export async function mediaBlobTo16kMonoWav(blob) {
  const arrayBuf = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuf.slice(0));
  } finally {
    await audioCtx.close();
  }
  const mono = toMono(audioBuffer);
  const resampled = resampleLinear(mono, audioBuffer.sampleRate, 16000);
  return encodeWavFromFloat32(resampled, 16000);
}

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}
