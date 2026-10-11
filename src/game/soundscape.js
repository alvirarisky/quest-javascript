export class Soundscape {
  constructor(context) {
    this.context = context;
    this.ready = false;
    this.enabled = false;
    this.active = false;
    this.volume = 0.45;
    this.danger = 0;
  }
  unlock() {
    const ctx = this.context();
    ctx.resume().catch(() => {});
    if (!this.effectLoading) {
      this.effects = {};
      this.voices = new Set();
      this.lastEffectAt = {};
      this.effectLoading = Promise.allSettled(
        [
          "impact",
          "step",
          "door",
          "machine",
          "radio",
          "knock",
          "pipe",
          "steam",
          "robot",
          "scan",
          "whisper",
        ].map(async (name) => {
          const response = await fetch(`/audio/null07-${name}.wav`);
          if (!response.ok) throw new Error(`Sound unavailable: ${name}`);
          this.effects[name] = await ctx.decodeAudioData(
            await response.arrayBuffer(),
          );
        }),
      ).then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") console.warn(result.reason.message);
        });
      });
    }
    if (this.loading) return;
    this.loading = fetch("/audio/null07-ambience.wav")
      .then((r) => {
        if (!r.ok) throw new Error("Ambience unavailable");
        return r.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((buffer) => {
        this.source = ctx.createBufferSource();
        this.source.buffer = buffer;
        this.source.loop = true;
        this.gain = ctx.createGain();
        this.gain.gain.value = 0;
        this.filter = ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.source
          .connect(this.filter)
          .connect(this.gain)
          .connect(ctx.destination);
        this.source.start();
        this.ready = true;
        this.update();
      })
      .catch((error) => {
        console.warn("Ambience could not load:", error.message);
        this.loading = null;
      });
  }
  impact() {
    return this.play("scare");
  }
  play(kind) {
    const name =
      kind === "scare" ? "impact" : kind === "haunt" ? "knock" : kind;
    const buffer = this.effects?.[name];
    if (!this.enabled || !buffer) return false;
    const ctx = this.context();
    const interval =
      { step: 0.12, door: 0.6, machine: 1.5, knock: 2.5, radio: 0.2 }[name] ||
      0.1;
    if (ctx.currentTime - (this.lastEffectAt[name] ?? -100) < interval)
      return true;
    this.lastEffectAt[name] = ctx.currentTime;
    if (this.voices.size >= 6) {
      const oldest = this.voices.values().next().value;
      oldest.source.stop();
    }
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.playbackRate.value =
      name === "scan" ? 1 : 0.94 + Math.random() * 0.12;
    gain.gain.value =
      this.volume *
      ({
        impact: 0.65,
        step: 0.13,
        door: 0.3,
        machine: 0.18,
        radio: 0.18,
        knock: 0.24,
        pipe: 0.15,
        steam: 0.15,
        robot: 0.2,
        scan: 0.2,
        whisper: 0.12,
      }[name] || 0.2);
    const pan = ctx.createStereoPanner();
    pan.pan.value = ["knock", "pipe", "whisper"].includes(name)
      ? Math.random() < 0.5
        ? -0.55
        : 0.55
      : 0;
    source.connect(gain).connect(pan).connect(ctx.destination);
    const voice = { source, gain, pan, name };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    source.start();
    return true;
  }
  stopEffects(all = false) {
    for (const voice of this.voices || []) {
      if (all || !["impact", "scan"].includes(voice.name)) voice.source.stop();
    }
  }
  set(enabled, active, volume, danger = 0) {
    if (
      this.enabled === enabled &&
      this.active === active &&
      this.volume === volume &&
      this.danger === danger
    )
      return;
    if (!enabled || !active) this.stopEffects(!enabled);
    if (this.volume !== volume) {
      for (const voice of this.voices || [])
        voice.gain.gain.value *= this.volume ? volume / this.volume : 0;
    }
    Object.assign(this, { enabled, active, volume, danger });
    this.update();
  }
  update() {
    if (!this.ready) return;
    const time = this.context().currentTime;
    this.gain.gain.setTargetAtTime(
      this.enabled && this.active
        ? this.volume * (0.45 + this.danger * 0.12)
        : 0,
      time,
      0.15,
    );
    this.filter.frequency.setTargetAtTime(650 + this.danger * 650, time, 0.25);
    this.source.playbackRate.setTargetAtTime(1 + this.danger * 0.02, time, 0.4);
  }
}
