# Storyboard · Story 01 — ¿Cuánto cuesta un video en motion graphics?

Estado: **aprobado por Jerry (oct 2026)**, con la tabla de puntos y los tiempos propuestos.

Concepto: "Nada se queda quieto". La página empieza quieta (gris, timecode en `00:00:00:00`) y gana color y
ritmo conforme el visitante baja. El timecode del sitio (abajo a la izquierda) nombra cada acto: `01 Quieto`,
`02 Chispa`, `03 Movimiento`, `04 Resultado`.

Reglas comunes a las 4 escenas:
- Composición HTML + CSS + GSAP con convenciones de HyperFrames (diseño 1920×1080, una timeline pausada).
  Se recompone en **16:9 en escritorio y 4:5 en móvil**. El contenedor reserva su espacio (cero CLS).
- El texto que importa está en el HTML de la página, nunca solo dentro de la escena. Cada escena lleva
  `role="img"` + `aria-label`, salvo la 3, que es un formulario real.
- Scrub = el avance del scroll mueve la timeline (suavizado, sin pin largo: la escena se queda fija como
  máximo 1 pantalla). Fuera de pantalla no corre nada.
- Reduced motion: cada escena muestra su frame final, estático. Sin JS: igual.
- Sin sonido. Paleta y tipografía del sitio (ink, volt, magenta, violeta, blanco · Archivo).

---

## Escena 1 · Quieto — "¿Cuánto cuesta?" (scrub, 4 s de timeline)

**Qué cuenta:** la duda del cliente. Todo detenido.

| Tiempo | 16:9 | 4:5 |
|---|---|---|
| 0 % | Etiqueta de precio gris, horizontal, centrada, con "$?" grande. Grid tenue. Regla de timecode abajo, playhead en 0, `00:00:00:00`. | Igual, la etiqueta de pie. |
| 25 % | Aparecen alrededor, muy tenues, signos de interrogación y cifras tachadas ("$ ? ? ?") que se desvanecen: el ruido de buscar precios. | Igual, apilados arriba y abajo. |
| 50 % | La etiqueta tiembla una vez (un solo golpe, no un loop). | — |
| 75 % | Un zoom lento hacia el "$?". | — |
| 100 % | La etiqueta queda grande, gris, quieta. El timecode sigue en `00:00:00:00`: nada se ha movido todavía. | — |

Frame final (reduced motion / OG): la etiqueta gris con "$?".

## Escena 2 · Chispa — "No es un número, son decisiones" (scrub, 7 s de timeline)

**Qué cuenta:** el insight. Primer movimiento y primer color. Es la misma composición del teaser del home
(`s01-cover`), aquí controlada por scroll.

| Tiempo | Qué pasa |
|---|---|
| 0 % | Continúa desde la escena 1: etiqueta gris, `00:00:00:00`. |
| 15 % | El timecode empieza a correr. La etiqueta se balancea sobre su ojal. |
| 35 % | El color entra: gris → volt, magenta, violeta, blanco. |
| 55 % | La etiqueta se rompe en 4 piezas; el "$?" se parte con ellas y se apaga. |
| 75 % | Cada pieza dibuja su idea: Duración (barra que crece), Estilo (círculo, cuadrado, triángulo), Formatos (16:9, 9:16, 1:1), Extras (onda de audio). |
| 100 % | Las 4 piezas a color, separadas. `00:00:07:00`. |

4:5: la etiqueta de pie; las piezas se apilan (ya construido y validado en el teaser del home).

## Escena 3 · Movimiento — el cotizador interactivo (sin scrub)

**Qué cuenta:** la solución. El visitante arma su video y una mini-pieza animada responde en vivo. El
movimiento aquí lo provoca la persona, no el scroll.

**Controles** (formulario real: `fieldset` + `legend`, radios y casillas nativos, operables con teclado y
lector de pantalla; el resultado se anuncia con `aria-live="polite"`):

| Control | Opciones | Puntos (propuesta) |
|---|---|---|
| Duración | 6–15 s · 30 s · 60 s · 90–120 s | 1 · 2 · 3 · 4 |
| Estilo | Tipografía animada · Gráficos e ilustración · Personajes · 3D | 1 · 2 · 4 · 4 |
| Guion | Lo traigo yo · Lo desarrolla MOVO | 0 · 1 |
| Formatos (varios) | 16:9 · 9:16 · 1:1 / 4:5 | +0.5 por cada formato después del primero |
| Extras (varios) | Cortes para anuncios (6/15/30 s) · Versión en otro idioma · Voz en off (incluida) | +1 · +1 · 0 |
| Urgencia | Calendario normal · Lo necesito urgente | 0 · +1 |

**Resultado** (se actualiza al instante, sin cifras de dinero):

| Total | Nivel de inversión | Complejidad | Tiempo aproximado |
|---|---|---|---|
| hasta 4 | **Esencial** | Baja | Un par de días |
| 4.5 a 7 | **Avanzado** | Media | Alrededor de una semana `[PENDIENTE: validar]` |
| 7.5 o más | **Premium** | Alta | Un par de semanas |

`[PENDIENTE: Jerry valida los puntos, los cortes de nivel y el tiempo del nivel medio]`

**La mini-pieza** (un cuadro 16:9 / 4:5 junto a los controles; en móvil, arriba y fija mientras se eligen
los controles):
- **Duración** → la regla de timecode se alarga y el timecode final cambia (`00:00:15:00`, `00:01:00:00`…).
- **Estilo** → la escena cambia de "piel": tipografía que entra por letras; formas e íconos ilustrados; un
  personaje simple que parpadea y saluda; un objeto con volumen (cubo con luz y sombra, falso 3D en CSS).
- **Formatos** → aparecen marcos 16:9, 9:16 y 1:1 superpuestos que recortan la misma escena.
- **Extras** → se encienden etiquetas (AD 6/15/30, ES/EN, VO) y una onda de audio cuando hay voz.
- **Urgencia** → el playhead corre al doble de velocidad.
- Más puntos = más elementos, más color y más ritmo en la mini-pieza.

Reduced motion: los cambios se aplican sin transición. Sin JS: el formulario se ve con un texto que explica
la tabla y un enlace directo a contacto.

## Escena 4 · Resultado — "Tu video, en movimiento" (scrub corto, 3 s de timeline)

**Qué cuenta:** qué gana el negocio. La escena se asienta y se queda.

| Tiempo | Qué pasa |
|---|---|
| 0 % | La mini-pieza del cotizador, con lo elegido, se centra y crece. |
| 50 % | A su alrededor se ordenan las elecciones como clips en una línea de tiempo (Duración · Estilo · Guion · Formatos · Extras), cada uno con su color. |
| 100 % | Todo quieto y a color: "tu video" terminado. Timecode en su duración final. |

Debajo, en HTML: el resumen en texto ("Elegiste: 60 s · Gráficos e ilustración · Guion de MOVO · 16:9 y
9:16 · Cortes para anuncios → Avanzado") y el botón **Cotiza tu proyecto** →
`/contacto/?story=01&duracion=60&estilo=ilustracion&guion=movo&formatos=16x9,9x16&extras=cortes&urgencia=normal`.

**Prellenado en /contacto/:** la página de contacto lee esos parámetros y escribe en el mensaje del
formulario un resumen editable ("Vengo de la story ¿Cuánto cuesta…? Me interesa: 60 s, gráficos e
ilustración…"). También selecciona el servicio cuando aplica y envía `story=01` en un campo oculto para
saber de dónde vino el contacto. Se puede implementar: el formulario es nuestro (Web3Forms), basta leer la
URL al cargar.

---

## Presupuesto técnico

- Escenas 1, 2 y 4 + cotizador: objetivo < 40 KB comprimidos de JS + CSS propios (límite del playbook: 150 KB).
  GSAP ya está cargado en el sitio; ScrollTrigger se carga solo en esta página.
- Validación (paso 5): capturas al 0/25/50/75/100 % de cada escena en 375, 768 y 1440 px, reduced motion y
  medición de peso.
