// Resamples mic input (whatever the hardware rate is) down to 16 kHz
// 16-bit little-endian PCM and posts chunks to the main thread.
class PCM16kWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.sourceRate = sampleRate;
    this.ratio = this.sourceRate / this.targetRate;
    this.buffer = [];
    this.chunkSize = 2048; // ~128ms at 16 kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0];

    // Linear interpolation resample
    for (let i = 0; i < ch.length; i += this.ratio) {
      const idx = Math.floor(i);
      const frac = i - idx;
      const next = idx + 1 < ch.length ? ch[idx + 1] : ch[idx];
      const sample = ch[idx] * (1 - frac) + next * frac;
      this.buffer.push(sample);
    }

    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.splice(0, this.chunkSize);
      const pcm = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-16k", PCM16kWorklet);
