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
  MUSIC_VOLUME   : 0.45,  // Volumen base para música de fondo
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
//    "enemyPool" → Pool genérico + pools opcionales por tipo/nombre de enemigo.
//                  Usa el pool del enemigo si existe; si no, usa "generic".
//                  Añadir entradas en "byEnemy" cuando existan los archivos.
//
//    "themePool" → Pool genérico + pools opcionales por tema de sala.
//                  Usa el pool del tema si existe; si no, usa "generic".
//                  Permite que varios temas compartan la misma pista.
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

  // Muerte de enemigo — con variantes opcionales por nombre de enemigo
  enemyDeath: {
    type   : "enemyPool",
    volume : 0.7,

    // Sonido genérico de fallback (se usa cuando el tema no tiene pool propio)
    generic: {
      type : "files",
      files: ["assets/audio/enemy/default_enemy.mp3"],
    },

    // Pools por enemigo: descomentar/editar cuando existan los audios.
    // Convencion recomendada: assets/audio/enemy/<slug-enemigo>.mp3
    byEnemy: {
      // "Grumo": { type: "files", files: ["assets/audio/enemy/grumo.mp3"] },
      // "Vena": { type: "files", files: ["assets/audio/enemy/vena.mp3"] },
      // "Chef Nigiri": { type: "files", files: ["assets/audio/enemy/chef-nigiri.mp3"] },
    },
  },

  // Música de fondo por tema de sala (preparada para futuros MP3)
  backgroundSoundtrack: {
    type  : "themePool",
    volume: AUDIO_CONFIG.MUSIC_VOLUME,

    // Pista por defecto para cualquier tema sin configuración específica
    generic: {
      type : "files",
      files: ["assets/audio/music/main-theme.mp3"],
    },

    // Configuración modular por tema (ROOM_THEMES en constants.js)
    byTheme: {
      Isaac : { type: "files", files: ["assets/audio/music/theme-isaac.mp3"] },
      Japon : { type: "files", files: ["assets/audio/music/theme-japon.mp3"] },
      Moho  : { type: "files", files: ["assets/audio/music/theme-moho.mp3"] },
      Hielo : { type: "files", files: ["assets/audio/music/theme-hielo.mp3"] },
      Dorado: { type: "files", files: ["assets/audio/music/theme-dorado.mp3"] },
    },
  },

};


// ─────────────────────────────────────────────────────────────────────────────
//  SFX — objeto principal del sistema de audio
// ─────────────────────────────────────────────────────────────────────────────

const SFX = {

  _enabled: true,
  _pools  : {},   // { [eventKey]: Howl[]  |  { generic: Howl[], themes: {…} } }
  _music  : {
    soundtrack: null,
    theme     : null,
  },


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
      case "enemyPool": return this._buildEnemyPool(label, def);
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
   * Construye un pool con variantes por enemigo.
   * Devuelve { generic: Howl[], byEnemy: { [enemyName]: Howl[] } }
   */
  _buildEnemyPool(label, def) {
    const entry = {
      generic: this._buildEntry(`${label}:generic`, { ...def.generic, volume: def.volume }),
      byEnemy : {},
    };

    for (const [enemyName, enemyDef] of Object.entries(def.byEnemy || {})) {
      entry.byEnemy[enemyName] = this._buildEntry(
        `${label}:${enemyName}`,
        { ...enemyDef, volume: def.volume },
      );
    }

    return entry;
  },

  /**
   * Construye un pool con variantes por tema.
   * Devuelve { generic: Howl[], byTheme: { [themeName]: Howl[] } }
   */
  _buildThemePool(label, def) {
    const entry = {
      generic: this._buildEntry(`${label}:generic`, { ...def.generic, volume: def.volume }),
      byTheme: {},
    };

    for (const [themeName, themeDef] of Object.entries(def.byTheme || {})) {
      entry.byTheme[themeName] = this._buildEntry(
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

    const loadedSounds = pool.filter((sound) => sound.state() === "loaded");
    if (loadedSounds.length > 0) {
      const sound = loadedSounds[Math.floor(Math.random() * loadedSounds.length)];
      const pitch = AUDIO_CONFIG.PITCH_MIN
        + Math.random() * (AUDIO_CONFIG.PITCH_MAX - AUDIO_CONFIG.PITCH_MIN);
      sound.rate(pitch);
      sound.play();
      return;
    }

    const loadingSound = pool.find((sound) => sound.state() === "loading");
    if (loadingSound) {
      AudioLogger.info(`_play("${label}"): sonido cargando, en espera…`);
      loadingSound.once("load", () => {
        const pitch = AUDIO_CONFIG.PITCH_MIN
          + Math.random() * (AUDIO_CONFIG.PITCH_MAX - AUDIO_CONFIG.PITCH_MIN);
        loadingSound.rate(pitch);
        loadingSound.play();
      });
      return;
    }

    AudioLogger.warn(`_play("${label}"): no hay sonidos listos para reproducir.`);
  },

  /**
   * Resuelve el pool a usar para un enemyPool.
   * Devuelve el pool del enemigo si existe, o el genérico como fallback.
   *
   * @param {{ generic: Howl[], byEnemy: object }} entry
   * @param {string|null} enemyName
   * @returns {Howl[]|null}
   */
  _resolveEnemyPool(entry, enemyName) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      AudioLogger.warn("_resolveEnemyPool: entrada inválida.");
      return null;
    }

    if (enemyName && entry.byEnemy?.[enemyName]) {
      return entry.byEnemy[enemyName];
    }

    return entry.generic ?? null;
  },

  /**
   * Resuelve el pool a usar para un themePool.
   * Devuelve el pool del tema si existe, o el genérico como fallback.
   *
   * @param {{ generic: Howl[], byTheme: object }} entry
   * @param {string|null} themeName
   * @returns {Howl[]|null}
   */
  _resolveThemePool(entry, themeName) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      AudioLogger.warn("_resolveThemePool: entrada inválida.");
      return null;
    }

    if (themeName && entry.byTheme?.[themeName]) {
      return entry.byTheme[themeName];
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
   * Si existe un pool para ese enemigo, lo usa; si no, usa el genérico.
   *
   * @param {string|null} enemyName - Nombre/tipo de enemigo actual.
   *   Pasar null para usar el genérico.
   */
  enemyDeath(enemyName = null) {
    const entry = this._getPool("enemyDeath");
    if (!entry) return;

    const pool = this._resolveEnemyPool(entry, enemyName);
    this._play(pool, `enemyDeath:${enemyName ?? "generic"}`);
  },

  /**
   * Prepara la banda sonora de fondo para un tema.
   * No reproduce automáticamente: deja el Howl listo para usar.
   *
   * @param {string|null} themeName - Nombre del tema (Isaac, Japon, Moho...)
   * @returns {Howl|null}
   */
  loadBackgroundSoundtrack(themeName = null) {
    const entry = this._getPool("backgroundSoundtrack");
    if (!entry) return null;

    const pool = this._resolveThemePool(entry, themeName);
    if (!Array.isArray(pool) || pool.length === 0) {
      AudioLogger.warn(`loadBackgroundSoundtrack("${themeName ?? "generic"}"): pool vacío.`);
      return null;
    }

    const loaded = pool.filter((sound) => sound.state() === "loaded");
    const soundtrack = loaded.length > 0
      ? loaded[Math.floor(Math.random() * loaded.length)]
      : pool[0];

    if (!soundtrack) {
      AudioLogger.warn(`loadBackgroundSoundtrack("${themeName ?? "generic"}"): sin pista válida.`);
      return null;
    }

    soundtrack.loop(true);
    soundtrack.rate(1);

    this._music.soundtrack = soundtrack;
    this._music.theme = themeName ?? "generic";

    AudioLogger.info(`Banda sonora preparada para tema "${this._music.theme}".`);
    return soundtrack;
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
