const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SAVE_KEY = "perros-demo-save-v1";

const ASSETS = {
  playerFront: "assets/characters/player-front.png",
  playerRight: "assets/characters/player-right.png",
  playerLeft: "assets/characters/player-left.png",
  playerItem: "assets/characters/player-item.png",
  playerDead: "assets/characters/player-dead.png",
  playerHit: "assets/characters/player-hit.png",
  slime: "assets/characters/enemy-slime.png",
  room: "assets/environment/room-red.png",
  roomJapan: "assets/environment/room-japan.png",
  roomMinecraft: "assets/environment/room-minecraft.png",
  roomDisco: "assets/environment/room-disco.png",
  menuBg: "assets/ui/menu-bg.png",
  menuPaper: "assets/ui/menu-paper.png",
  pressStart: "assets/ui/press-start.png",
  title: "assets/ui/title.png",
  newRun: "assets/ui/new-run.png",
  continue: "assets/ui/continue.png",
  stats: "assets/ui/stats.png",
  options: "assets/ui/options.png",
  heartRed: "assets/ui/heart-red.png",
  heartBlack: "assets/ui/heart-black.png",
  coin: "assets/pickups/coin.png",
  key: "assets/pickups/key.png",
  bomb: "assets/pickups/bomb.png",
  doorOpen: "assets/environment/door-open.png",
  doorClosed: "assets/environment/door-closed.png",
  doorJammed: "assets/environment/door-jammed.png",
  doorExploded: "assets/environment/door-exploded.png",
  doorBossOpen: "assets/environment/door-boss-open.png",
  doorBossClosed: "assets/environment/door-boss-closed.png",
  doorJapanOpen: "assets/environment/door-japan-open.png",
  doorJapanClosed: "assets/environment/door-japan-closed.png",
  doorJapanJammed: "assets/environment/door-japan-jammed.png",
  doorJapanExploded: "assets/environment/door-japan-exploded.png",
  doorJapanBossOpen: "assets/environment/door-japan-boss-open.png",
  doorJapanBossClosed: "assets/environment/door-japan-boss-closed.png",
  chestWoodClosed: "assets/environment/chests/wood-closed.png",
  chestWoodOpen: "assets/environment/chests/wood-open.png",
  chestSilverClosed: "assets/environment/chests/silver-closed.png",
  chestSilverOpen: "assets/environment/chests/silver-open.png",
  chestGoldClosed: "assets/environment/chests/gold-closed.png",
  chestGoldOpen: "assets/environment/chests/gold-open.png",
  enemyNigiriAtun: "assets/enemies/nigiri-atun.png",
  enemyNigiriSalmonFlameado: "assets/enemies/nigiri-salmon-flameado.png",
  relicPapelHigienico: "assets/relics/papel-higienico.png",
  relicSillaGamer: "assets/relics/silla-gamer.png",
  relicCalcetinSucio: "assets/relics/calcetin-sucio.png",
  relicHormiga: "assets/relics/hormiga.png",
  relicHormiguero: "assets/relics/hormiguero.png",
  relicTecla: "assets/relics/tecla.png",
  relicLlavePorsche: "assets/relics/llave-porsche.png",
  relicCableMordido: "assets/relics/cable-mordido.png",
  relicLijadora: "assets/relics/lijadora.png",
  relicMando: "assets/relics/mando.png",
  relicColacao: "assets/relics/colacao.png",
  relicSetup: "assets/relics/setup.png",
  relicNigiriSalmon: "assets/relics/nigiri-salmon.png",
  relicCrepChocolate: "assets/relics/crep-chocolate.png",
  relicPalillosChinos: "assets/relics/palillos-chinos.png",
  relicSalsaSoja: "assets/relics/salsa-soja.png",
  relicSalsaGoodSoup: "assets/relics/salsa-good-soup.png",
  relicRastaDani: "assets/relics/rasta-dani.png",
  relicPegatinaPerros: "assets/relics/pegatina-perros.png",
  relicTalon: "assets/relics/talon.png",
  relicPerrosCode: "assets/relics/perros-code.png",
  merchantClosed: "assets/characters/merchant-closed.png",
  merchantOpen: "assets/characters/merchant-open.png",
  healerCesc: "assets/characters/cesc.png",
  roomChurch: "assets/environment/room-church.png",
  enemyBible: "assets/enemies/bible-biter.png",
  enemyFerri: "assets/enemies/ferri.png",
  bossVictor: "assets/bosses/victor.png",
  victorCross: "assets/enemies/victor-cross.png",
  enemyMaki: "assets/enemies/maki.png",
  enemyNinja: "assets/enemies/ninja.png",
  bossAdri: "assets/bosses/adri.png",
  bossMonica: "assets/bosses/monica.png",
  enemyCreeper: "assets/enemies/creeper.png",
  enemyZombieChicken: "assets/enemies/zombie-chicken.png",
  enemyFly: "assets/enemies/fly.png",
  enemyPooter: "assets/enemies/pooter.png",
  enemyClotty: "assets/enemies/clotty.png",
  bossAlexPout: "assets/bosses/alex-pout.png",
  bossAlexOpen: "assets/bosses/alex-open.png",
  enemyEnderman: "assets/enemies/enderman.png",
  bossSamu: "assets/bosses/samu.png",
  minecraftPickaxe: "assets/enemies/minecraft-pickaxe.png",
  minecraftBlock: "assets/environment/minecraft-block.png",
  enemyBorracho: "assets/enemies/borracho.png",
  enemyXaviJump: "assets/enemies/xavi-jump.png",
  enemyXaviLaser: "assets/enemies/xavi-laser.png",
  xaviRay: "assets/enemies/xavi-ray.png",
  bossJajo: "assets/bosses/jajo.png",
};

const ROOM_THEMES = [
  { name: "Isaac", roomImage: "room", tint: "rgba(78, 8, 8, 0.18)", glow: "rgba(195, 45, 38, 0.22)" },
  { name: "Japon", roomImage: "roomJapan", tint: "rgba(178, 87, 38, 0.08)", glow: "rgba(255, 185, 108, 0.18)" },
  { name: "Minecraft", roomImage: "roomMinecraft", tint: "rgba(46, 108, 44, 0.08)", glow: "rgba(111, 202, 86, 0.18)" },
  { name: "Iglesia", roomImage: "roomChurch", tint: "rgba(92, 50, 18, 0.06)", glow: "rgba(255, 188, 102, 0.18)" },
  { name: "Discoteca", roomImage: "roomDisco", tint: "rgba(108, 30, 116, 0.08)", glow: "rgba(255, 88, 185, 0.18)" },
  { name: "Rastas", tint: "rgba(83, 117, 36, 0.16)", glow: "rgba(174, 208, 72, 0.18)" },
  { name: "Taller", tint: "rgba(44, 80, 101, 0.16)", glow: "rgba(91, 187, 222, 0.18)" },
  { name: "Pendiente 8", tint: "rgba(87, 47, 100, 0.16)", glow: "rgba(191, 115, 218, 0.18)" },
  { name: "Pendiente 9", tint: "rgba(111, 83, 30, 0.16)", glow: "rgba(224, 174, 62, 0.18)" },
  { name: "Cuarto de Roberto", tint: "rgba(42, 44, 58, 0.16)", glow: "rgba(138, 158, 206, 0.18)" },
];

const ROOM_TYPE_NAMES = {
  fightBasic: "Pelea",
  fightMixed: "Mixta",
  fightElite: "Elite",
  chestRoom: "Cofre",
  woodChest: "Madera",
  silverChest: "Plata",
  goldChest: "Dorado",
  madShop: "Mercader",
  healerRoom: "Cesc",
  sacrificeRoom: "Sacrificio",
  riskEvent: "Riesgo",
  jokeRoom: "Secreta",
  boss: "Boss",
};

const NON_EMPTY_ROOM_TYPES = new Set(Object.keys(ROOM_TYPE_NAMES));
const JOKE_ROOM_CHANCE = 0.0002;
const ROOM_21_MERCHANT_CHANCE = 0.85;
const HEALER_ROOM_CHANCES = { 16: 0.85, 43: 0.85, 85: 0.85 };

const ROOM_TYPE_TABLE = [
  { value: "fightBasic", weight: 58 },
  { value: "fightMixed", weight: 18 },
  { value: "fightElite", weight: 14 },
  { value: "chestRoom", weight: 12 },
  { value: "riskEvent", weight: 6 },
];

const RELIC_RARITY_WEIGHTS = {
  fight: { "Poco comÃºn": 76, "Rara": 20, "Ã‰pica": 4, "Legendaria": 0, "MÃ­tica": 0 },
  woodChest: { "Poco comÃºn": 68, "Rara": 25, "Ã‰pica": 7, "Legendaria": 0, "MÃ­tica": 0 },
  silverChest: { "Poco comÃºn": 42, "Rara": 42, "Ã‰pica": 14, "Legendaria": 2, "MÃ­tica": 0 },
  goldChest: { "Poco comÃºn": 22, "Rara": 45, "Ã‰pica": 24, "Legendaria": 8, "MÃ­tica": 1 },
  boss: { "Poco comÃºn": 16, "Rara": 47, "Ã‰pica": 26, "Legendaria": 10, "MÃ­tica": 1 },
  bossJapan: { "Poco comÃºn": 12, "Rara": 42, "Ã‰pica": 30, "Legendaria": 13, "MÃ­tica": 3 },
};

const RELIC_CATALOG = [
  { id: "papel-higienico", name: "Papel HigiÃ©nico", rarity: "Rara", type: "Carga / proyectiles", effect: "Cada 18 s sin recibir daÃ±o, el siguiente disparo se convierte en triple proyectil en abanico. Si recibes daÃ±o, se reinicia el contador.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "silla-gamer", name: "Silla Gamer", rarity: "Poco comÃºn", type: "Tanque / estÃ¡tico", effect: "+2 de vida mÃ¡xima. Si estÃ¡s quieto 1 s, ganas +15% cadencia hasta que te muevas.", pools: ["fight", "woodChest", "silverChest"], weight: 13 },
  { id: "calcetin-sucio", name: "CalcetÃ­n Sucio", rarity: "Poco comÃºn", type: "Velocidad / rastro", effect: "+18% velocidad. Al moverte dejas un rastro toxico continuo durante 4 s que daÃ±a a enemigos que lo pisan.", pools: ["fight", "woodChest", "silverChest"], weight: 13 },
  { id: "hormiga", name: "Hormiga", rarity: "Poco comÃºn", type: "InvocaciÃ³n", effect: "Al entrar en una sala, 35% de invocar 1 hormiga aliada que persigue y muerde al enemigo mÃ¡s cercano.", pools: ["fight", "woodChest", "silverChest"], weight: 12 },
  { id: "hormiguero", name: "Hormiguero", rarity: "Ã‰pica", type: "Combo / invocaciÃ³n", effect: "Sin Hormiga: cada 3 salas invoca 1 hormiga aliada. Con Hormiga: siempre aparece al menos 1 hormiga al entrar en sala y pueden acumularse hasta 3.", pools: ["goldChest", "boss"], weight: 5 },
  { id: "tecla", name: "Tecla", rarity: "Rara", type: "Escalado", effect: "Cada sala de pelea limpiada sin recibir daÃ±o otorga +0,3% cadencia permanente. MÃ¡ximo +15%.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "llave-porsche", name: "Llave de Porsche", rarity: "Ã‰pica", type: "Velocidad / escalado boss", effect: "+15% velocidad. Cada boss derrotado aÃ±ade +3% velocidad permanente. MÃ¡ximo +30% total por esta reliquia.", pools: ["goldChest", "boss"], weight: 5 },
  { id: "cable-mordido", name: "Cable Mordido", rarity: "Rara", type: "Electricidad", effect: "Tus impactos siempre generan una chispa que rebota hasta entre 3 enemigos cercanos.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "lijadora", name: "Lijadora", rarity: "Rara", type: "Debuff / taller", effect: "Los enemigos golpeados quedan lijados durante 3 s y reciben +10% daÃ±o de tus siguientes proyectiles.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "mando", name: "Mando", rarity: "Rara", type: "Autodisparo", effect: "Cada 2 s dispara automÃ¡ticamente un proyectil pequeÃ±o al enemigo mÃ¡s cercano. Hace 40% del daÃ±o normal y no puede hacer crÃ­tico.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "colacao", name: "ColaCao", rarity: "Poco comÃºn", type: "Buff inicial", effect: "Durante los primeros 10 s de cada sala de pelea, ganas +22% cadencia.", pools: ["fight", "woodChest", "silverChest"], weight: 12 },
  { id: "setup", name: "Setup", rarity: "Legendaria", type: "Duplicador / potenciador", effect: "Potencia un 50% una reliquia que ya tengas. No puede potenciarse a sÃ­ mismo.", pools: ["goldChest", "boss"], weight: 2 },
  { id: "nigiri-salmon", name: "Nigiri de SalmÃ³n", rarity: "Rara", type: "CuraciÃ³n / sushi", effect: "Cada 5 salas de pelea limpiadas recuperas medio corazÃ³n.", pools: ["silverChest", "goldChest", "bossJapan"], weight: 8 },
  { id: "crep-chocolate", name: "Crep de Chocolate", rarity: "Poco comÃºn", type: "Postre / boss reward", effect: "Tras derrotar un boss recuperas +2 de vida adicional.", pools: ["fight", "woodChest", "silverChest", "bossJapan"], weight: 11 },
  { id: "palillos-chinos", name: "Palillos Chinos", rarity: "Rara", type: "Triple proyectil", effect: "Cada 4 disparos lanzas 3 proyectiles paralelos al 72% de daÃ±o cada uno.", pools: ["silverChest", "goldChest", "bossJapan"], weight: 8 },
  { id: "salsa-soja", name: "Salsa de Soja", rarity: "Rara", type: "Marca / debuff", effect: "12% de tus disparos aplican Soja. Los enemigos con Soja reciben +8% daÃ±o durante 4 s.", pools: ["silverChest", "goldChest", "bossJapan"], weight: 8 },
  { id: "salsa-good-soup", name: "Salsa Good Soup", rarity: "Ã‰pica", type: "Picante / daÃ±o por tiempo", effect: "10% de tus disparos aplican Picante. El enemigo recibe daÃ±o durante 3 s. Con Soja provoca una pequeÃ±a explosiÃ³n.", pools: ["goldChest", "bossJapan"], weight: 5 },
  { id: "rasta-dani", name: "Rasta de Dani", rarity: "Rara", type: "Orbitante", effect: "Crea una rasta orbitando alrededor del jugador. DaÃ±a enemigos al contacto y puede bloquear proyectiles pequeÃ±os ocasionalmente.", pools: ["silverChest", "goldChest", "boss"], weight: 7 },
  { id: "pegatina-perros", name: "Pegatina Perros", rarity: "Rara", type: "Grupo / recompensa", effect: "Al limpiar una sala, 10% de recibir una recompensa extra pequeÃ±a: moneda, corazÃ³n, llave o bomba.", pools: ["silverChest", "goldChest", "boss"], weight: 7 },
  { id: "talon", name: "Talon", rarity: "Ã‰pica", type: "Counter / ejecuciÃ³n", effect: "Cada 12 enemigos matados aparece una cuchillada automÃ¡tica sobre el enemigo con mÃ¡s vida de la sala.", pools: ["goldChest", "boss"], weight: 4 },
  { id: "perros-code", name: "Perros Code", rarity: "Legendaria", type: "Reglas / artÃ­culos", effect: "Cada 4 salas activa un artÃ­culo aleatorio beneficioso del Perros Code.", pools: ["goldChest", "boss"], weight: 2 },
];

const RELIC_IMAGE_KEYS = {
  "papel-higienico": "relicPapelHigienico",
  "silla-gamer": "relicSillaGamer",
  "calcetin-sucio": "relicCalcetinSucio",
  hormiga: "relicHormiga",
  hormiguero: "relicHormiguero",
  tecla: "relicTecla",
  "llave-porsche": "relicLlavePorsche",
  "cable-mordido": "relicCableMordido",
  lijadora: "relicLijadora",
  mando: "relicMando",
  colacao: "relicColacao",
  setup: "relicSetup",
  "nigiri-salmon": "relicNigiriSalmon",
  "crep-chocolate": "relicCrepChocolate",
  "palillos-chinos": "relicPalillosChinos",
  "salsa-soja": "relicSalsaSoja",
  "salsa-good-soup": "relicSalsaGoodSoup",
  "rasta-dani": "relicRastaDani",
  "pegatina-perros": "relicPegatinaPerros",
  talon: "relicTalon",
  "perros-code": "relicPerrosCode",
};

for (const relic of RELIC_CATALOG) {
  relic.image = RELIC_IMAGE_KEYS[relic.id] || null;
}

const DOOR_SIDES = ["top", "right", "bottom", "left"];
const DOOR_INFO = {
  top: { x: WIDTH / 2 - 56, y: 88, w: 112, h: 56 },
  right: { x: WIDTH - 130, y: HEIGHT / 2 - 56, w: 58, h: 112 },
  bottom: { x: WIDTH / 2 - 56, y: HEIGHT - 116, w: 112, h: 56 },
  left: { x: 72, y: HEIGHT / 2 - 56, w: 58, h: 112 },
};

const ENEMY_CATALOG = {
  Isaac: [
    { name: "Mosca", tier: 1, tint: "rgba(180, 35, 35, 0.28)", rScale: 0.82, hpScale: 0.34, speedScale: 1.72, canShoot: false, sprite: "enemyFly" },
    { name: "Pooter", tier: 2, tint: "rgba(120, 0, 0, 0.38)", rScale: 1, hpScale: 0.92, speedScale: 0.52, canShoot: true, sprite: "enemyPooter", pattern: "pooter" },
    { name: "Clotty", tier: 3, tint: "rgba(255, 78, 78, 0.32)", rScale: 1.16, hpScale: 1.46, speedScale: 0.42, canShoot: true, sprite: "enemyClotty", pattern: "clotty" },
  ],
  Japon: [
    { name: "Maki rodador", tier: 1, tint: "rgba(255, 188, 132, 0.28)", rScale: 1.42, hpScale: 1.55, speedScale: 1.38, canShoot: false, sprite: "enemyMaki", pattern: "maki" },
    { name: "Ninja", tier: 2, tint: "rgba(215, 71, 67, 0.30)", rScale: 1.02, hpScale: 1.15, speedScale: 0.76, canShoot: true, sprite: "enemyNinja", pattern: "ninja" },
    { name: "Ninja veterano", tier: 3, tint: "rgba(165, 58, 42, 0.34)", rScale: 1.08, hpScale: 1.7, speedScale: 0.82, canShoot: true, sprite: "enemyNinja", pattern: "ninja" },
  ],
  Minecraft: [
    { name: "Creeper", tier: 1, tint: "rgba(62, 190, 84, 0.36)", rScale: 1.18, hpScale: 1.2, speedScale: 1.08, canShoot: false, sprite: "enemyCreeper", pattern: "creeper" },
    { name: "Baby zombie en pollo", tier: 2, tint: "rgba(113, 196, 68, 0.38)", rScale: 1.06, hpScale: 0.82, speedScale: 1.82, canShoot: false, sprite: "enemyZombieChicken" },
    { name: "Creeper cargado", tier: 3, tint: "rgba(86, 224, 207, 0.42)", rScale: 1.3, hpScale: 1.65, speedScale: 1.12, canShoot: false, sprite: "enemyCreeper", pattern: "creeper" },
    { name: "Enderman", tier: 3, tint: "rgba(112, 53, 158, 0.38)", rScale: 1.18, hpScale: 1.72, speedScale: 1.02, canShoot: false, sprite: "enemyEnderman", pattern: "enderman" },
  ],
  Iglesia: [
    { name: "Biblia mordedora", tier: 1, tint: "rgba(160, 98, 46, 0.22)", rScale: 1.04, hpScale: 1.24, speedScale: 1.12, canShoot: false, sprite: "enemyBible" },
    { name: "Biblia feroz", tier: 2, tint: "rgba(196, 126, 54, 0.24)", rScale: 1.12, hpScale: 1.52, speedScale: 1.18, canShoot: false, sprite: "enemyBible" },
    { name: "Ferri", tier: 3, tint: "rgba(211, 50, 40, 0.24)", rScale: 1.18, hpScale: 2.15, speedScale: 1.08, canShoot: false, sprite: "enemyFerri" },
  ],
  Discoteca: [
    { name: "Borracho", tier: 1, tint: "rgba(171, 76, 255, 0.34)", rScale: 1.08, hpScale: 1.08, speedScale: 1.04, canShoot: false, sprite: "enemyBorracho", pattern: "drunk" },
    { name: "Borracho perdido", tier: 2, tint: "rgba(255, 64, 164, 0.34)", rScale: 1.12, hpScale: 1.2, speedScale: 1.12, canShoot: false, sprite: "enemyBorracho", pattern: "drunk" },
    { name: "Borracho pesado", tier: 3, tint: "rgba(255, 118, 76, 0.34)", rScale: 1.2, hpScale: 1.48, speedScale: 0.96, canShoot: false, sprite: "enemyBorracho", pattern: "drunk" },
  ],
  Rastas: [
    { name: "Rasta gusano", tier: 1, tint: "rgba(172, 194, 56, 0.34)", rScale: 0.82, hpScale: 0.8, speedScale: 1.42, canShoot: false },
    { name: "Bola de pelo", tier: 2, tint: "rgba(76, 53, 29, 0.42)", rScale: 1.18, hpScale: 1.5, speedScale: 1.1, canShoot: false, pattern: "maki" },
    { name: "Rasta endurecida", tier: 3, tint: "rgba(124, 146, 39, 0.38)", rScale: 1.12, hpScale: 1.8, speedScale: 1.08, canShoot: false },
  ],
  Taller: [
    { name: "Mancha de pintura", tier: 1, tint: "rgba(54, 162, 205, 0.36)", rScale: 1, hpScale: 1.18, speedScale: 1.04, canShoot: true },
    { name: "Lata rodante", tier: 2, tint: "rgba(189, 202, 209, 0.38)", rScale: 1.14, hpScale: 1.48, speedScale: 1.2, canShoot: false, pattern: "maki" },
    { name: "Mancha toxica", tier: 3, tint: "rgba(218, 78, 115, 0.38)", rScale: 1.18, hpScale: 1.72, speedScale: 0.96, canShoot: true },
  ],
  "Pendiente 8": [
    { name: "Provisional 8A", tier: 1, tint: "rgba(167, 105, 205, 0.32)", rScale: 1, hpScale: 1.3, speedScale: 1.08, canShoot: false },
    { name: "Provisional 8B", tier: 2, tint: "rgba(122, 74, 180, 0.36)", rScale: 1.12, hpScale: 1.7, speedScale: 1.02, canShoot: true },
  ],
  "Pendiente 9": [
    { name: "Provisional 9A", tier: 1, tint: "rgba(221, 170, 66, 0.34)", rScale: 1.02, hpScale: 1.45, speedScale: 1.12, canShoot: false },
    { name: "Provisional 9B", tier: 2, tint: "rgba(183, 118, 38, 0.38)", rScale: 1.14, hpScale: 1.85, speedScale: 1.02, canShoot: true },
  ],
  "Cuarto de Roberto": [
    { name: "Cable vivo", tier: 1, tint: "rgba(80, 173, 244, 0.38)", rScale: 0.92, hpScale: 1.38, speedScale: 1.28, canShoot: true },
    { name: "Calcetin vivo", tier: 2, tint: "rgba(195, 185, 151, 0.38)", rScale: 1.12, hpScale: 1.72, speedScale: 1.12, canShoot: false },
    { name: "Cable pelado", tier: 3, tint: "rgba(235, 212, 72, 0.42)", rScale: 1.18, hpScale: 2.1, speedScale: 1.06, canShoot: true },
  ],
};

const images = {};
const keys = new Set();
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

const hud = document.querySelector("#hud");
const heartsEl = document.querySelector("#hearts");
const coinsEl = document.querySelector("#coins");
const keysEl = document.querySelector("#keys");
const bombsEl = document.querySelector("#bombs");
const roomCountEl = document.querySelector("#roomCount");
const gameOver = document.querySelector("#gameOver");
const retryBtn = document.querySelector("#retryBtn");
const gameOverMenuBtn = document.querySelector("#gameOverMenuBtn");
const runSummary = document.querySelector("#runSummary");
const victory = document.querySelector("#victory");
const victoryBtn = document.querySelector("#victoryBtn");
const victorySummary = document.querySelector("#victorySummary");
const statsMenu = document.querySelector("#statsMenu");
const statsBackBtn = document.querySelector("#statsBackBtn");
const collectionRelics = document.querySelector("#collectionRelics");
const collectionProgress = document.querySelector("#collectionProgress");
const recordsGrid = document.querySelector("#recordsGrid");
const pauseMenu = document.querySelector("#pauseMenu");
const resumeBtn = document.querySelector("#resumeBtn");
const pauseMenuBtn = document.querySelector("#pauseMenuBtn");
const pauseNewRunBtn = document.querySelector("#pauseNewRunBtn");
const pauseStats = document.querySelector("#pauseStats");
const pauseRelics = document.querySelector("#pauseRelics");
const merchantMenu = document.querySelector("#merchantMenu");
const merchantOffers = document.querySelector("#merchantOffers");
const merchantCoins = document.querySelector("#merchantCoins");
const merchantInfo = document.querySelector("#merchantInfo");
const merchantCloseBtn = document.querySelector("#merchantCloseBtn");
const secretToolBtn = document.querySelector("#secretToolBtn");
const debugPanel = document.querySelector("#debugPanel");
const debugLock = document.querySelector("#debugLock");
const debugCodeInput = document.querySelector("#debugCodeInput");
const debugToolsPanel = document.querySelector("#debugTools");
const debugRoomSelect = document.querySelector("#debugRoomSelect");
const debugGoRoomBtn = document.querySelector("#debugGoRoomBtn");
const debugLabBtn = document.querySelector("#debugLabBtn");
const debugSpawnEnemyBtn = document.querySelector("#debugSpawnEnemyBtn");
const debugHealBtn = document.querySelector("#debugHealBtn");
const debugCloseBtn = document.querySelector("#debugCloseBtn");
const debugGodMode = document.querySelector("#debugGodMode");
const debugOneShot = document.querySelector("#debugOneShot");
const debugUnlimitedMoney = document.querySelector("#debugUnlimitedMoney");
const optionsMenu = document.querySelector("#optionsMenu");
const optionsBackBtn = document.querySelector("#optionsBackBtn");
const masterVolume = document.querySelector("#masterVolume");
const musicVolume = document.querySelector("#musicVolume");
const effectsVolume = document.querySelector("#effectsVolume");
const muteAudio = document.querySelector("#muteAudio");
const screenShake = document.querySelector("#screenShake");
const screenFlashes = document.querySelector("#screenFlashes");
const damageNumbers = document.querySelector("#damageNumbers");
const highContrast = document.querySelector("#highContrast");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const resetOptionsBtn = document.querySelector("#resetOptionsBtn");
const upgradeMenu = document.querySelector("#upgradeMenu");
const upgradeOptions = document.querySelector("#upgradeOptions");
const upgradeTitle = document.querySelector("#upgradeTitle");
const upgradeSubtitle = document.querySelector("#upgradeSubtitle");
const setupPreview = document.querySelector("#setupPreview");
const healerMenu = document.querySelector("#healerMenu");
const healerCoins = document.querySelector("#healerCoins");
const healerOffers = document.querySelector("#healerOffers");
const healerCloseBtn = document.querySelector("#healerCloseBtn");

const OPTIONS_KEY = "binding-of-perros-options";
const DEFAULT_OPTIONS = {
  masterVolume: 80,
  musicVolume: 65,
  effectsVolume: 85,
  muteAudio: false,
  screenShake: true,
  screenFlashes: true,
  damageNumbers: true,
  highContrast: false,
};
let options = null;

const MENU_START_BOUNDS = { x: WIDTH / 2 - 150, y: 545, w: 300, h: 49 };
const MAIN_MENU_ITEMS = [
  { id: "newRun", image: "newRun", crop: { x: 340, y: 450, w: 787, h: 155 }, bounds: { x: WIDTH / 2 - 140, y: 225, w: 280, h: 55 }, enabled: () => true },
  { id: "continue", image: "continue", crop: { x: 372, y: 450, w: 741, h: 157 }, bounds: { x: WIDTH / 2 - 139, y: 306, w: 278, h: 59 }, enabled: () => hasCurrentRun() },
  { id: "stats", image: "stats", crop: { x: 462, y: 452, w: 563, h: 129 }, bounds: { x: WIDTH / 2 - 118, y: 389, w: 236, h: 54 }, enabled: () => true },
  { id: "options", image: "options", crop: { x: 360, y: 454, w: 789, h: 147 }, bounds: { x: WIDTH / 2 - 140, y: 468, w: 280, h: 52 }, enabled: () => true },
];
let menuPressHover = false;
let mainMenuHover = null;

let lastTime = performance.now();
let mode = "loading";
let save = null;
let state = null;
const debugState = {
  panelOpen: false,
  unlocked: false,
  godMode: false,
  oneShot: false,
  unlimitedMoney: false,
  selectedRoom: null,
};
let balanceData = null;
let merchantMenuOpen = false;
let healerMenuOpen = false;
let upgradeMenuOpen = false;
let upgradeMenuKind = "boss";

const SETUP_IMPROVEMENTS = {
  "papel-higienico": "El abanico pasa de 3 a 5 proyectiles.",
  "silla-gamer": "La bonificacion quieto sube de +15% a +25% cadencia.",
  "calcetin-sucio": "El rastro tÃƒÂ³xico hace un 50% mÃƒÂ¡s de daÃƒÂ±o.",
  hormiga: "La probabilidad de invocar una hormiga sube del 35% al 60%.",
  hormiguero: "Puede acumular hasta 5 hormigas aliadas.",
  tecla: "La mejora permanente por sala limpia sube de +0,3% a +0,5%.",
  "llave-porsche": "Obtienes un +10% de velocidad adicional.",
  "cable-mordido": "La chispa rebota hasta entre 5 enemigos.",
  lijadora: "Los enemigos lijados reciben +18% de daÃƒÂ±o en lugar de +10%.",
  mando: "El autodisparo pasa de cada 2 s a cada 1 s.",
  colacao: "El impulso inicial dura 16 s en lugar de 10 s.",
  "nigiri-salmon": "Cura cada 3 salas en lugar de cada 5.",
  "crep-chocolate": "Tras cada boss recuperas 3 de vida en lugar de 2.",
  "palillos-chinos": "Cada 4 disparos lanza 5 proyectiles en lugar de 3.",
  "salsa-soja": "La probabilidad de aplicar Soja sube del 12% al 24%.",
  "salsa-good-soup": "La probabilidad de aplicar Picante sube del 10% al 20%.",
  "rasta-dani": "La rasta orbitante gira y golpea un 50% mÃƒÂ¡s rÃƒÂ¡pido.",
  "pegatina-perros": "La recompensa extra sube del 10% al 22%.",
  talon: "La cuchillada se activa cada 8 bajas en lugar de cada 12.",
  "perros-code": "El artÃƒÂ­culo beneficioso se activa cada 3 salas.",
};

const BOSS_UPGRADES = [
  { id: "hp", name: "Vida", description: "+1 corazÃ³n mÃ¡ximo y recuperas 1.", apply: (player) => addMaxHp(1) },
  { id: "damage", name: "DaÃ±o", description: "+0,65 de daÃ±o.", apply: (player) => { player.damage += 0.65; } },
  { id: "fireRate", name: "Cadencia", description: "+8% de cadencia.", apply: (player) => { player.fireDelay = Math.max(0.1, player.fireDelay * 0.92); } },
  { id: "speed", name: "Velocidad", description: "+7% de velocidad.", apply: (player) => { player.speed *= 1.07; } },
  { id: "crit", name: "CrÃ­tico", description: "+5% de probabilidad crÃ­tica.", apply: (player) => { player.critChance = Math.min(0.65, (player.critChance || 0) + 0.05); } },
  { id: "defense", name: "Defensa", description: "+5% de probabilidad de bloquear daÃ±o.", apply: (player) => { player.damageReduction = Math.min(0.55, (player.damageReduction || 0) + 0.05); } },
  { id: "coins", name: "Moneda extra", description: "+1 moneda por cada moneda recogida.", apply: (player) => { player.coinBonus = Math.min(4, (player.coinBonus || 0) + 1); } },
  { id: "luck", name: "Suerte", description: "+7% de suerte para encontrar llaves.", apply: (player) => { player.keyLuck = Math.min(0.5, (player.keyLuck || 0) + 0.07); } },
];

window.__perrosDebug = () => ({
  mode,
  hasCurrentRun: hasCurrentRun(),
  room: state?.room ?? 0,
  roomType: state?.roomProfile?.type ?? "none",
  chestVariant: state?.roomProfile?.chestVariant ?? null,
  doorSides: state?.roomProfile?.doorSides ?? [],
  bombDoorSide: state?.roomProfile?.bombDoorSide ?? null,
  theme: state?.roomProfile?.theme?.name ?? "",
  hp: state?.player?.hp ?? 0,
  facing: state?.player?.facing ?? "front",
  aimX: state?.player?.aimX ?? 0,
  aimY: state?.player?.aimY ?? 1,
  enemies: state?.enemies?.length ?? 0,
  chests: state?.chests?.length ?? 0,
  shopItems: state?.shopItems?.filter((item) => !item.bought).length ?? 0,
  pickups: state?.pickups?.length ?? 0,
  coins: state?.coins ?? 0,
  keys: state?.keys ?? 0,
  bombs: state?.bombs ?? 0,
  relics: state?.player?.items?.length ?? 0,
  allies: state?.allies?.length ?? 0,
  toxicTrails: state?.toxicTrails?.length ?? 0,
});

