# Storyboard · Story 02 — Cómo explicar un producto complejo en 60 segundos

Estado: **en espera de aprobación de Jerry**. Nada de esto se anima antes de la aprobación.

Concepto: "Nada se queda quieto". La página empieza con un producto explicado de más (gris, saturado,
congelado) y, conforme bajas, todo se reduce a una idea que se mueve. Timecode del sitio: `01 Quieto`,
`02 Chispa`, `03 Movimiento`, `04 Resultado`. Reglas comunes iguales a la Story 01 (HyperFrames, 16:9 / 4:5,
texto en HTML, scrub suave, reduced motion = frame final, sin sonido, paleta del sitio).

## Escena 1 · Quieto — "Todo a la vez" (`s02-still`, scrub, 4 s)

**Qué cuenta:** el video que intenta decirlo todo.

| Tiempo | Qué pasa (16:9; en 4:5 lo mismo, apilado) |
|---|---|
| 0 % | Una "pantalla de video" gris llena de bloques: barras de texto, íconos, flechas, una tabla, un logo genérico ("TU PRODUCTO"). Timecode `00:00:00:00`. |
| 25 % | Llegan más bloques encima: viñetas, un diagrama, un segundo texto. Todo gris. |
| 50 % | La pantalla se satura: los bloques se enciman, se tapan entre sí. |
| 75 % | Todo tiembla un instante: demasiado. |
| 100 % | Quieto, gris, saturado. El timecode no avanzó: el video nunca empezó a funcionar. |

## Escena 2 · Chispa — "Una sola idea" (`s02-cover`, scrub, 7 s) — portada de la story

**Qué cuenta:** el insight: una idea, y el minuto repartido.

| Tiempo | Qué pasa |
|---|---|
| 0 % | La pantalla saturada de la escena 1. |
| 20 % | El timecode empieza a correr. Los bloques caen y se desvanecen uno por uno. |
| 40 % | Queda una sola barra de texto al centro; toma color (volt): "la idea". |
| 60 % | La barra se estira hasta convertirse en una línea de tiempo de 60 s. |
| 80 % | La línea se divide en 4 segmentos de color con su nombre: Gancho · Problema · Solución · Cierre. |
| 100 % | Línea de tiempo completa, a color; `00:00:07:00`. |

## Escena 3 · Movimiento — "El explainer se desarma" (`s02-layers`, scrub, 6 s)

**Qué cuenta:** cómo se construye, por capas. La misma escena (una persona, un teléfono con un mensaje, un
check) aparece en sus cuatro etapas, como hojas apiladas que se separan en perspectiva.

| Tiempo | Qué pasa |
|---|---|
| 0 % | Una sola hoja: el **guion** (líneas de texto, una resaltada). |
| 25 % | Se separa una segunda hoja: el **storyboard** (la misma escena en trazos blancos, sin color). |
| 50 % | Tercera hoja: el **styleframe** (la escena a color, quieta). |
| 75 % | Cuarta hoja: la **animación** (la escena se mueve: el mensaje entra, el check aparece). |
| 100 % | Las 4 hojas abiertas en abanico, cada una con su etiqueta: Guion · Storyboard · Styleframe · Animación. |

4:5: las hojas se abren hacia abajo en vez de hacia un lado. Etiquetas en HTML junto al texto de las etapas.

## Escena 4 · Resultado — "Tu producto, en 60 segundos" (`s02-result`, scrub, 3 s)

**Qué cuenta:** qué gana el negocio: una idea que se entiende.

| Tiempo | Qué pasa |
|---|---|
| 0 % | La pantalla de video vacía. |
| 50 % | Entra la escena animada de la capa 4, limpia, con una sola frase en volt. |
| 100 % | Debajo, la línea de 60 s completa con su playhead al final y la palabra "Entendido." en un check. |

Debajo, en HTML: CTA **Cuéntanos tu producto** → `/contacto/?story=02&servicio=explicativos` (el mensaje
llega prellenado con "Vengo de la story «Cómo explicar un producto complejo en 60 segundos»").

## Presupuesto

JS + CSS propios de las 4 escenas: objetivo < 20 KB comprimidos (límite del playbook: 150 KB).
