const SFX = {
  _enabled: true,
  _merchantPool: [],
  _enemyDeathPool: [],

  init() {
    this._merchantPool = this._loadPool("merchant", 3);
    this._enemyDeathPool = this._loadPool("enemy", 2);
  },

  _loadPool(folder, count) {
    const pool = [];
    for (let i = 1; i <= count; i++) {
      const src = `assets/audio/${folder}/${folder}-${i}.mp3`;
      pool.push(new Howl({ src: [src], volume: 0.7, preload: true }));
    }
    return pool;
  },

  _play(pool) {
    if (!this._enabled || !pool.length) return;
    const index = Math.floor(Math.random() * pool.length);
    const sound = pool[index];
    if (sound.state() === "loaded") {
      sound.rate(0.85 + Math.random() * 0.3);
      sound.play();
    }
  },

  merchantBuy() {
    this._play(this._merchantPool);
  },

  enemyDeath() {
    this._play(this._enemyDeathPool);
  },

  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  },
};
