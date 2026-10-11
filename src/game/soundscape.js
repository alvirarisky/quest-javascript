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
      this.effectLoading = fetch("/audio/null07-impact.wav")
        .then((r) => {
          if (!r.ok) throw new Error("Impact unavailable");
          return r.arrayBuffer();
        })
        .then((bytes) => ctx.decodeAudioData(bytes))
        .then((buffer) => {
          this.effect = buffer;
        })
        .catch(() => {
          this.effectLoading = null;
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
    if (!this.enabled || !this.effect) return false;
    const ctx = this.context();
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = this.effect;
    source.playbackRate.value = 0.94 + Math.random() * 0.12;
    gain.gain.value = this.volume * 0.65;
    source.connect(gain).connect(ctx.destination);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start();
    return true;
  }
  set(enabled, active, volume, danger = 0) {
    if (
      this.enabled === enabled &&
      this.active === active &&
      this.volume === volume &&
      this.danger === danger
    )
      return;
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
