const SFX = {
  _enabled: true,
  _merchantPool: [],
  _enemyDeathPool: [],

  init() {
    this._log("init()");
    this._merchantPool = this._loadPool("merchant", 3);
    this._enemyDeathPool = this._loadSingle("assets/audio/enemy/muerte_jordi.mp3");
  },

  _log(...args) {
    console.log("[SFX]", ...args);
  },

  _loadPool(folder, count, exts = ["mp3"]) {
    const pool = [];
    for (let i = 1; i <= count; i++) {
      const src = exts.map((e) => `assets/audio/${folder}/${folder}-${i}.${e}`);
      pool.push(new Howl({
        src, volume: 0.7, preload: true, html5: true,
        onloaderror: (_id, err) => this._log(`Error cargando ${folder}-${i}:`, err),
      }));
    }
    return pool;
  },

  _loadSingle(path) {
    const pool = [];
    const sound = new Howl({
      src: [path], volume: 0.7, preload: true, html5: true,
      onloaderror: (_id, err) => this._log("Error cargando", path, err),
      onload: () => this._log("Cargado OK:", path),
    });
    pool.push(sound);
    return pool;
  },

  _play(pool, label = "sonido") {
    if (!this._enabled || !pool.length) return;
    const index = Math.floor(Math.random() * pool.length);
    const sound = pool[index];
    const st = sound.state();
    this._log(`_play(${label}) state=${st}`);
    if (st === "loaded") {
      sound.rate(0.85 + Math.random() * 0.3);
      sound.play();
    } else if (st === "loading") {
      sound.once("load", () => {
        this._log(`_play(${label}) load event fired`);
        sound.rate(0.85 + Math.random() * 0.3);
        sound.play();
      });
    } else {
      this._log(`_play(${label}) estado inesperado: ${st}`);
    }
  },

  merchantBuy() {
    this._play(this._merchantPool, "merchant");
  },

  enemyDeath() {
    this._play(this._enemyDeathPool, "enemyDeath");
  },

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  },
};
