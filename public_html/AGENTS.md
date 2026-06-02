# The Binding of Perros - Guia maestra del proyecto

## Objetivo

Juego web roguelike de accion 2D inspirado en la estructura de *The Binding of Isaac*,
pero con personajes, bromas internas, reliquias, enemigos y bosses propios.

La partida completa tiene 100 salas. Cada 10 salas termina una etapa con un boss.
Al derrotar al boss de la sala 100 se gana la run.

Esta guia describe la version real que esta dentro de esta carpeta. Debe actualizarse
cuando cambien mecanicas importantes.

## Carpeta que se debe editar y publicar

La version principal del juego esta en:

```text
C:\Users\ot7\Documents\Codex\2026-05-22\files-mentioned-by-the-user-chatgpt
```

Para Hostinger deben subirse los archivos de esta carpeta principal. No usar copias
antiguas de `hostinger-upload` ni carpetas duplicadas.

## Estructura actual

```text
/
  index.html       Entrada de la web y estructura de menus
  style.css        Estilos de menus, overlays, HUD y responsive
  game.js          Toda la logica, catalogos, balance, guardado y render Canvas
  AGENTS.md        Esta guia
  assets/
    bosses/
    characters/
    chests/
    enemies/
    environment/
    pickups/
    relics/
    ui/
```

No existe actualmente una separacion en `js/constants.js`, `rendering.js`,
`save.js` o `main.js`. Antes de crear archivos nuevos hay que comprobar si realmente
aporta valor, porque el prototipo actual funciona como una web estatica sencilla.

## Tecnologia

- HTML5 Canvas.
- JavaScript vanilla.
- CSS vanilla.
- `localStorage` para guardar progreso local.
- Assets PNG pixel-art.
- Sin proceso de build obligatorio.
- Se puede publicar directamente en un hosting estatico.

## Flujo de menus

1. Pantalla inicial con titulo y `PRESS START`.
2. Menu principal con `NEW RUN`, `CONTINUE`, `STATS` y `OPTIONS`.
3. `CONTINUE` aparece atenuado cuando no existe una partida guardada.
4. `STATS` muestra estadisticas, records y coleccion de reliquias.
5. `OPTIONS` incluye ajustes como volumen y pantalla completa.
6. `ESC` abre la pausa durante la partida.
7. Al morir debe aparecer Game Over con opcion `Back to menu`. No reiniciar la run
   automaticamente.

Se evitan acentos en textos visibles nuevos porque algunos hostings han mostrado
problemas de codificacion.

## Controles

- Movimiento: WASD y flechas.
- Disparo: raton y controles alternativos ya conectados en el juego.
- Interactuar: `E`.
- Pausa: `ESC`.
- Inicio desde portada: Enter, espacio o clic.

Durante la partida se bloquean atajos web molestos siempre que sea razonable para no
romper la experiencia al jugar en navegador.

## Jugador

Roberto es el personaje principal. Sus sprites definitivos estan dentro de
`assets/characters/`.

Reglas visuales:

- Al soltar una tecla lateral vuelve a mirar de frente.
- Al recoger una reliquia usa la pose con manos arriba.
- La reliquia recogida aparece cerca de las manos y con el contorno de su rareza.
- El sprite rojo se usa al recibir dano.
- El sprite muerto se usa al perder la run.

HUD:

- Vida con corazones rojos llenos y negros al perder vida.
- Monedas, bombas y llaves empiezan en 0.
- Distribucion visual inspirada en Isaac.
- No mostrar textos innecesarios como `Sala limpia`.
- Mostrar `Sala N`.

## Salas y puertas

- Run lineal de 100 salas.
- Nunca generar una sala vacia normal.
- Excepcion extremadamente rara: sala broma con texto en el suelo.
- Boss obligatorio cada 10 salas.
- Las puertas de combate solo se abren al derrotar a todos los enemigos.
- Tras un boss vuelven a aparecer puertas normales.
- Las salas pueden tener de 1 a 4 puertas.
- Peso deseado: 2 puertas es lo mas frecuente, luego 3, luego 1 y finalmente 4.
- Las puertas usan assets reales y se rotan o voltean para las cuatro paredes.

Tipos especiales:

- Sala de combate.
- Sala de boss.
- Sala de cofres.
- Mercader.
- Sacrificio.
- Medico.
- Sala broma extremadamente rara.
- Sala laboratorio de pruebas desde debug.

## Cofres

Usar siempre los assets reales de `assets/chests/`.

Tipos:

- Madera.
- Plata.
- Oro.

Reglas:

- Acercarse muestra la indicacion `E`.
- Abrir cambia al sprite abierto.
- Los cofres no deben dar llaves.
- Los cofres deben dar reliquia.
- Debe existir una garantia de sala de cofres si durante demasiadas salas no aparece
  ninguna.

## Recompensas

- Las salas de combate deben dar recompensas con frecuencia suficiente para que no
  existan cadenas largas sin monedas ni recursos.
- Cada boss siempre deja una reliquia.
- Las reliquias no se repiten durante una misma run.
- Si ya no quedan reliquias disponibles, usar recursos alternativos donde proceda.
- Al derrotar un boss se elige 1 mejora entre 3 opciones aleatorias:
  vida, dano, cadencia, velocidad, critico, defensa, moneda extra o suerte.

## Reliquias

Hay 21 reliquias. Usar los sprites definitivos de `assets/relics/`.

1. Papel Higienico
2. Silla Gamer
3. Calcetin Sucio
4. Hormiga
5. Hormiguero
6. Tecla
7. Llave de Porsche
8. Cable Mordido
9. Lijadora
10. Mando
11. ColaCao
12. Setup
13. Nigiri de Salmon
14. Crep de Chocolate
15. Palillos Chinos
16. Salsa de Soja
17. Salsa Good Soup
18. Rasta de Dani
19. Pegatina Perros
20. Talon
21. Perros Code

Reglas:

- No usar la categoria de rareza comun. Las reliquias deben sentirse potentes.
- Mostrar contorno de color siguiendo la forma transparente de la imagen, no una
  tarjeta cuadrada.
- En pausa aparecen las reliquias adquiridas con tooltip.
- Tooltip: nombre en negrita y debajo descripcion del efecto.
- En `STATS` ordenar por rareza.
- Las reliquias no descubiertas aparecen como silueta negra sin revelar el contenido.
- Las descubiertas muestran imagen y descripcion.
- Algunas reliquias modifican claramente el disparo: rebote entre enemigos,
  proyectiles extra y disparo automatico.
- Si conviven disparo automatico y disparo manual, ambos funcionan a la vez.
- `Setup` permite mejorar una reliquia adquirida. El selector debe mostrar antes y
  despues, destacando en verde el valor que aumenta.
- `Calcetin Sucio` deja un rastro duradero, con manchas cercanas entre si.
- `Perros Code` es especialmente efectivo contra Victor.

No modificar efectos sin revisar el Excel de balance mas reciente que entregue el
usuario.

## Mercader

- Sala con mercader sentado en el centro.
- Al acercarse aparece `E`.
- Al pulsar `E` se abre el menu de compra.
- Mostrar varias ofertas.
- Las reliquias aparecen con su imagen y contorno de rareza.
- Hover de reliquia: mismo formato informativo que la pausa.
- Si ya se poseen todas las reliquias, ofrecer vida, bombas, llaves o una compra de
  nada.
- La compra de nada gasta dinero y el mercader se rie.
- Sala 21: probabilidad muy alta de mercader.
- Tras el boss 20: probabilidad alta de mercader.
- El mercader tiene sprites de boca cerrada y abierta para dialogos futuros.

## Sala de sacrificio

- Sala 66 obligatoria.
- Tiene una imagen interactuable en el centro.
- Permite intercambiar vida por una recompensa.

## Medico

El medico se llama `Cesc` y usa su sprite propio.

Salas con 85% de probabilidad de medico:

- Sala 16.
- Sala 43.
- Sala 85.

Funcionamiento:

- Cesc aparece en el centro como el mercader.
- Acercarse muestra `E`.
- Permite comprar vida con oro.
- Ofertas de 1, 2 o 3 puntos de vida.
- Comprar packs mayores aplica un pequeno descuento.

## Debug privado

- Abrir pausa con `ESC`.
- Boton discreto en una esquina.
- Codigo actual: `2345`.

Herramientas:

- Saltar a cualquier sala, incluida una sala anterior.
- Mantener seleccion al activar opciones.
- Volver atras y quedarse en la sala actual.
- Modo inmortal.
- One shot.
- Dinero ilimitado.
- Laboratorio grande de pruebas para probar reliquias y mecanicas.

## Etapas implementadas o definidas

### Etapa 1 - Isaac - Salas 1 a 10

Enemigos:

- Mosca: persigue, contacto, poca vida, sale en grupos numerosos y es rapida.
- Pooter: lento, dispara hacia el jugador, 2 o 3 golpes.
- Clotty: resistente, dispara 3 proyectiles en abanico, 4 o 5 golpes.

Boss sala 10: `Alex`.

- Mucha vida.
- Barra de vida.
- Fase 1 y fase 2 al 50%.
- Salto con zona marcada.
- Escupitajo con sprite de boca abierta y abanico de proyectiles.
- Ataque de morritos con sprite propio.
- En fase 2 reduce pausas y ataca mas a menudo.

### Etapa 2 - Japon - Salas 11 a 20

Usar fondo japones y puertas japonesas.

Enemigos:

- Maki: grande, apunta al jugador, embiste muy rapido en linea recta y queda
  aturdido al chocar contra pared, jugador u otro maki.
- Ninja: dispara shuriken en varias direcciones.
- Cerca del boss pueden mezclarse makis y ninjas.

Boss sala 20: `Adri`, con segunda forma `Monica`.

- Adri invoca muchos nigiris de atun continuamente.
- Al morir se reencarna como Monica.
- Monica invoca nigiris de salmon flameado.
- Nigiris: rapidos, poca vida, contacto, poco dano y aparecen en cantidad.

### Etapa 3 - Minecraft - Salas 21 a 30

Usar fondo Minecraft.

Enemigos:

- Creeper: persigue, se detiene cerca, avisa durante 0.8 a 1 segundo y explota.
- Baby zombie en gallina: rapido, contacto y poca vida.
- Enderman: al recibir dano se teletransporta cerca del jugador sin aparecer encima.
  Cooldown de teletransporte de 1 a 2 segundos.

Boss sala 30: `Samu`.

- No invoca creepers ni baby zombies.
- Coloca bloques que bloquean movimiento y proyectiles.
- Lanza pico boomerang.
- Invoca endermans: maximo 1 en fase inicial y 2 despues.
- Puede crear muros de bloques con huecos. Nunca encerrar sin salida.
- Tres fases: 100-60%, 60-25% y 25-0%.

### Etapa 4 - Iglesia - Salas 31 a 40

Usar fondo iglesia.

Enemigos:

- Biblia mordedora: contacto, dificil.
- Ferri: contacto, mas fuerte y peligroso.

Escalado:

- Sala 31: muchas biblias.
- Despues introducir 1 o 2 Ferris mezclados con biblias.
- Aumentar Ferris gradualmente.
- Hacia el final pueden dominar la sala.

Mecanica Ferri:

- De vez en cuando muestra `que?` sobre la cabeza.
- Hay que pulsarlo rapidamente antes de que se apague.
- Si se falla, todos los Ferris se acercan y golpean automaticamente.
- Si se acierta, Roberto responde `lo que?`.
- Despues Ferri responde `que por que no te callas!`.

Boss sala 40: `Victor`.

- Muy dificil.
- Lanza cruces boomerang.
- Las cruces recorren mucha distancia y usan distintos patrones.
- `Perros Code` debe ser especialmente eficaz contra Victor.

### Etapa 5 - Discoteca - Salas 41 a 50

Usar fondo discoteca.

Enemigos:

- Borracho: persigue en zigzag, contacto, aparece en grupos.
- Xavi: elite especial de la sala 45.

Xavi sala 45:

- Es miniboss y muestra barra de vida.
- Antes de recibir dano salta y esquiva proyectiles de forma exagerada.
- Reacciona con mucha antelacion y realiza desplazamientos grandes.
- Tras el primer golpe entra permanentemente en modo laser.
- En modo laser permanece quieto.
- El laser gira lentamente siguiendo al jugador.
- Muestra aviso tenue antes de activarse.
- Ciclo actual: laser durante 3.4 segundos y pausa quieta durante 2.1 segundos.
- Usa el asset del rayo rojo.

Boss sala 50: `Jajo`.

- Marca una franja blanca amplia y semitransparente hacia el jugador.
- Tras el aviso activa un flash.
- La franja no hace dano directo: paraliza durante 0.8 a 1 segundo.
- Despues Jajo dispara hacia el jugador.
- Fase 1: 3 proyectiles.
- Fase 2 al 50%: franja mas ancha, aviso menor y mas proyectiles.

### Etapas 6 a 10 - Salas 51 a 100

Pendientes de definir con fondos, enemigos y bosses propios.
La sala 100 debe contener un boss final de dificultad muy elevada.

## Render y colisiones

- Mantener `imageSmoothingEnabled = false` para sprites pixel-art.
- Enemigos con hitbox: pueden solaparse parcialmente, pero no quedar totalmente uno
  dentro de otro.
- Los proyectiles deben recorrer distancias amplias. Evitar limites visuales
  demasiado cortos.
- Los bosses muestran barra de vida.
- Xavi muestra barra sin convertirse en boss real para no activar recompensas de boss.

## Guardado

Guardar en `localStorage`:

- Run actual para `CONTINUE`.
- Sala actual.
- Recursos.
- Stats del jugador.
- Reliquias adquiridas.
- Reliquias descubiertas para la coleccion.
- Records y estadisticas acumuladas.

Mantener compatibilidad con partidas guardadas siempre que sea posible.

## Reglas para futuros cambios

1. Editar siempre esta carpeta principal.
2. Tras cada cambio importante, renovar la version `?v=` de `game.js` en `index.html`
   para evitar cache antigua en Hostinger y navegador.
3. No sustituir sprites entregados por formas provisionales cuando ya existe el asset.
4. Mantener los nombres de bosses definidos: Alex, Adri, Monica, Samu, Victor, Xavi
   y Jajo.
5. No crear salas vacias normales.
6. No permitir abrir puertas de combate mientras existan enemigos vivos.
7. Cada boss suelta una reliquia y ofrece mejora de stat.
8. Revisar el Excel mas reciente antes de cambiar probabilidades o poderes.
9. Verificar sintaxis con `node --check game.js`.
10. Probar visualmente menus, sala afectada, pausa y HUD tras cambios importantes.

