// ═══════════════════════════════════════════════════════════════════
//  audio.js  —  Sistema de efectos de sonido
//  The Binding of Perros
//  Dependencia externa: Howler.js 2.2.4 (cargado antes en index.html)
// ═══════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────────────
//  LOGGER INTERNO
//  Tres niveles: INFO (flujo normal), WARN (problema no crítico), ERROR (fallo)
// ─────────────────────────────────────────────────────────────────────────────

const AudioLogger = {
  _prefix: "[SFX]",
  info (...args) { console.log  (this._prefix,          ...args); },
  warn (...args) { console.warn (this._prefix, "[WARN]",  ...args); },
  error(...args) { console.error(this._prefix, "[ERROR]", ...args); },
};


// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN GLOBAL
// ─────────────────────────────────────────────────────────────────────────────

const AUDIO_CONFIG = {
  VOLUME_DEFAULT : 0.7,   // Volumen base para todos los sonidos (0.0 – 1.0)
  PITCH_MIN      : 0.85,  // Variación mínima de pitch (rate en Howler)
  PITCH_MAX      : 1.15,  // Variación máxima de pitch
};


// ─────────────────────────────────────────────────────────────────────────────
//  REGISTRO DE SONIDOS
//
//  Cada clave es el nombre de un evento del juego.
//  Tipos de definición de pool:
//
//    "pool"      → N archivos con nombre estándar:
//                  assets/audio/<folder>/<folder>-1.mp3, -2.mp3, …
//
//    "files"     → Lista de rutas absolutas a archivos concretos.
//
//    "themePool" → Pool genérico + pools opcionales por tema de sala.
//                  Usa el pool del tema si existe; si no, usa "generic".
//                  Añadir entradas en "themes" cuando existan los archivos.
//
//  Los temas disponibles se definen en ROOM_THEMES (constants.js):
//    Isaac | Japon | Moho | Hielo | Dorado
// ─────────────────────────────────────────────────────────────────────────────

const SOUND_REGISTRY = {

  // Compra exitosa en la tienda del mercader
  merchantBuy: {
    type  : "pool",
    folder: "merchant",
    count : 3,
    volume: 0.7,
  },

  // Muerte de enemigo — con variantes opcionales por tema de sala
  enemyDeath: {
    type   : "themePool",
    volume : 0.7,

    // Sonido genérico de fallback (se usa cuando el tema no tiene pool propio)
    generic: {
      type : "files",
      files: ["assets/audio/enemy/muerte_jordi.mp3"],
    },

    // Pools por tema: descomentar cuando existan los archivos de audio.
    themes: {
      // Isaac : { type: "pool", folder: "enemy/isaac", count: 2 },
      // Japon : { type: "pool", folder: "enemy/japon", count: 2 },
      // Moho  : { type: "pool", folder: "enemy/moho",  count: 2 },
      // Hielo : { type: "pool", folder: "enemy/hielo", count: 2 },
      // Dorado: { type: "pool", folder: "enemy/dorado", count: 2 },
    },
  },

};


// ─────────────────────────────────────────────────────────────────────────────
//  SFX — objeto principal del sistema de audio
// ─────────────────────────────────────────────────────────────────────────────

const SFX = {

  _enabled: true,
  _pools  : {},   // { [eventKey]: Howl[]  |  { generic: Howl[], themes: {…} } }


  // ───────────────────────────────────────────────────────────
  //  INICIALIZACIÓN
  // ───────────────────────────────────────────────────────────

  /**
   * Carga todos los sonidos definidos en SOUND_REGISTRY.
   * Debe llamarse una sola vez, tras cargar Howler.js.
   */
  init() {
    AudioLogger.info("Iniciando sistema de audio…");
    this._pools = {};

    for (const [key, def] of Object.entries(SOUND_REGISTRY)) {
      try {
        this._pools[key] = this._buildEntry(key, def);
        AudioLogger.info(`Evento "${key}" registrado.`);
      } catch (err) {
        AudioLogger.error(`Error al registrar el evento "${key}":`, err);
      }
    }

    AudioLogger.info("Sistema de audio listo.");
  },


  // ───────────────────────────────────────────────────────────
  //  CONSTRUCCIÓN DE POOLS  (uso interno)
  // ───────────────────────────────────────────────────────────

  /** Delegador principal: decide el tipo de pool y lo construye. */
  _buildEntry(label, def) {
    switch (def.type) {
      case "pool":      return this._loadPool(label, def.folder, def.count, def.volume);
      case "files":     return this._loadFiles(label, def.files, def.volume);
      case "themePool": return this._buildThemePool(label, def);
      default:
        throw new Error(`Tipo de sonido desconocido: "${def.type}"`);
    }
  },

  /**
   * Carga N archivos siguiendo la convención:
   *   assets/audio/<folder>/<folder>-1.mp3, -2.mp3, …
   */
  _loadPool(label, folder, count, volume = AUDIO_CONFIG.VOLUME_DEFAULT) {
    const sounds = [];
    for (let i = 1; i <= count; i++) {
      const path = `assets/audio/${folder}/${folder}-${i}.mp3`;
      sounds.push(this._createHowl(label, path, volume));
    }
    return sounds;
  },

  /** Carga una lista explícita de rutas de archivo. */
  _loadFiles(label, files, volume = AUDIO_CONFIG.VOLUME_DEFAULT) {
    return files.map((path) => this._createHowl(label, path, volume));
  },

  /**
   * Construye un pool con variantes por tema.
   * Devuelve { generic: Howl[], themes: { [tema]: Howl[] } }
   */
  _buildThemePool(label, def) {
    const entry = {
      generic: this._buildEntry(`${label}:generic`, { ...def.generic, volume: def.volume }),
      themes : {},
    };

    for (const [themeName, themeDef] of Object.entries(def.themes)) {
      entry.themes[themeName] = this._buildEntry(
        `${label}:${themeName}`,
        { ...themeDef, volume: def.volume },
      );
    }

    return entry;
  },

  /** Crea un Howl con callbacks de log estandarizados. */
  _createHowl(label, path, volume = AUDIO_CONFIG.VOLUME_DEFAULT) {
    return new Howl({
      src        : [path],
      volume,
      preload    : true,
      html5      : true,
      onload     : ()         => AudioLogger.info (`Cargado: "${path}"`),
      onloaderror: (_id, err) => AudioLogger.warn (`No se pudo cargar "${path}" [${label}]:`, err),
      onplayerror: (_id, err) => AudioLogger.error(`Error al reproducir "${path}" [${label}]:`, err),
    });
  },


  // ───────────────────────────────────────────────────────────
  //  REPRODUCCIÓN  (uso interno)
  // ───────────────────────────────────────────────────────────

  /**
   * Reproduce un sonido aleatorio del pool, con pitch variado.
   * Si el sonido aún está cargando, espera al evento "load".
   *
   * @param {Howl[]} pool  - Array de Howl a usar.
   * @param {string} label - Etiqueta para mensajes de log.
   */
  _play(pool, label = "?") {
    if (!this._enabled) return;

    if (!Array.isArray(pool) || pool.length === 0) {
      AudioLogger.warn(`_play("${label}"): pool vacío o inválido.`);
      return;
    }

    const sound     = pool[Math.floor(Math.random() * pool.length)];
    const soundState = sound.state();

    const doPlay = () => {
      const pitch = AUDIO_CONFIG.PITCH_MIN
        + Math.random() * (AUDIO_CONFIG.PITCH_MAX - AUDIO_CONFIG.PITCH_MIN);
      sound.rate(pitch);
      sound.play();
    };

    if (soundState === "loaded") {
      doPlay();
    } else if (soundState === "loading") {
      AudioLogger.info(`_play("${label}"): sonido cargando, en espera…`);
      sound.once("load", doPlay);
    } else {
      AudioLogger.warn(`_play("${label}"): estado inesperado del sonido: "${soundState}".`);
    }
  },

  /**
   * Resuelve el pool a usar para un themePool.
   * Devuelve el pool del tema si existe, o el genérico como fallback.
   *
   * @param {{ generic: Howl[], themes: object }} entry
   * @param {string|null} theme
   * @returns {Howl[]|null}
   */
  _resolveThemePool(entry, theme) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      AudioLogger.warn("_resolveThemePool: entrada inválida.");
      return null;
    }

    if (theme && entry.themes?.[theme]) {
      return entry.themes[theme];
    }

    return entry.generic ?? null;
  },

  /**
   * Obtiene un pool por clave con advertencia si no existe.
   * @param {string} key
   * @returns {*|null}
   */
  _getPool(key) {
    const pool = this._pools[key];
    if (pool === undefined) {
      AudioLogger.warn(`Pool "${key}" no encontrado. ¿Se llamó a SFX.init()?`);
      return null;
    }
    return pool;
  },


  // ───────────────────────────────────────────────────────────
  //  API PÚBLICA — eventos del juego
  // ───────────────────────────────────────────────────────────

  /**
   * Reproduce un sonido de compra al adquirir un objeto en la tienda.
   * Llamar desde game.js cuando la transacción sea exitosa.
   */
  merchantBuy() {
    this._play(this._getPool("merchantBuy"), "merchantBuy");
  },

  /**
   * Reproduce un sonido de muerte de enemigo.
   * Si existe un pool para el tema actual, lo usa; si no, usa el genérico.
   *
   * @param {string|null} theme - Nombre del tema de sala actual
   *   (Isaac, Japon, Moho, Hielo, Dorado). Pasar null para usar el genérico.
   */
  enemyDeath(theme = null) {
    const entry = this._getPool("enemyDeath");
    if (!entry) return;

    const pool = this._resolveThemePool(entry, theme);
    this._play(pool, `enemyDeath:${theme ?? "generic"}`);
  },


  // ───────────────────────────────────────────────────────────
  //  UTILIDADES
  // ───────────────────────────────────────────────────────────

  /**
   * Activa o desactiva todos los sonidos.
   * @returns {boolean} Estado resultante (true = activado).
   */
  toggle() {
    this._enabled = !this._enabled;
    AudioLogger.info(`Audio ${this._enabled ? "activado" : "desactivado"}.`);
    return this._enabled;
  },

};
