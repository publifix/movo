# Storyboard · Story 03 — Tu logo ya no puede quedarse quieto

Estado: **en espera de aprobación de Jerry**. Nada de esto se anima antes de la aprobación.

Concepto: "Nada se queda quieto". Un logo gris y estático en medio de un feed que se mueve; conforme bajas,
el logo aprende a moverse y termina con la personalidad que el visitante elige. El logo de la demo es una
marca tipográfica ("TU MARCA" / "YOUR BRAND", o el nombre que escriba el visitante): ningún logo real de
cliente. Reglas comunes iguales a la Story 01.

## Escena 1 · Quieto — "Un logo quieto" (`s03-still`, scrub, 4 s)

| Tiempo | Qué pasa (16:9; en 4:5 lo mismo, vertical) |
|---|---|
| 0 % | Al centro, "TU MARCA" en gris sobre una tarjeta blanca apagada. Timecode `00:00:00:00`. |
| 25 % | Detrás pasan, hacia arriba, tarjetas de un feed (rectángulos grises con barras): todo se mueve menos el logo. |
| 50 % | El feed acelera; el logo sigue igual. |
| 75 % | El feed pasa tan rápido que el logo se pierde entre las tarjetas. |
| 100 % | Feed borroso, logo gris y quieto al centro. El timecode no avanzó. |

## Escena 2 · Chispa — "Un comportamiento" (`s03-cover`, scrub, 7 s) — portada de la story

| Tiempo | Qué pasa |
|---|---|
| 0 % | El logo gris, quieto, sobre ink. |
| 20 % | El timecode corre. Las letras se separan y se dibuja su contorno (trazo blanco). |
| 45 % | Cada letra entra con su propio movimiento: primer color (volt). |
| 70 % | Aparecen 4 "carriles" de una línea de tiempo de edición con keyframes (rombos) bajo el logo. |
| 100 % | Logo a color, armado; la línea de tiempo con sus keyframes; `00:00:07:00`. |

## Escena 3 · Movimiento — "Elige la personalidad" (`::logo`, interactivo, sin scrub)

**Controles** (formulario real, accesible): un campo de texto "Nombre de tu marca" (máx. 16 caracteres; vacío =
"TU MARCA") y 4 opciones de personalidad: **Preciso · Juguetón · Elegante · Enérgico**. Un botón "Repetir".

**La escena:** el nombre en grande, animado en vivo con la personalidad elegida (2–3 s, se repite al cambiar
y con el botón; se pausa fuera de pantalla):
- **Preciso:** las letras entran de abajo sobre una retícula, en línea recta, con tiempos exactos; una línea se
  dibuja debajo. Colores: blanco + volt.
- **Juguetón:** las letras caen y rebotan con squash & stretch, una a una. Colores: magenta + volt.
- **Elegante:** aparecen despacio, con desvanecido y espaciado que se cierra (tracking). Peso ligero. Blanco.
- **Enérgico:** cortes de 2 frames, letras que entran en bloque con un barrido, un destello. Violeta + volt.

Debajo se ve el mismo logo en **9:16, 1:1 y 16:9** sobre fondo de cuadros (transparencia).

Reduced motion: el logo se muestra en su estado final con la personalidad elegida, sin animación.
Sin JS: el nombre "TU MARCA" en su estado final y el texto explica las 4 personalidades.

## Escena 4 · Resultado — "Tu logo, en movimiento" (`s03-result`, scrub, 3 s)

| Tiempo | Qué pasa |
|---|---|
| 0 % | Tres marcos vacíos: 9:16, 1:1 y 16:9, sobre fondo de cuadros (transparente). |
| 50 % | El logo del visitante (con su personalidad) entra en cada marco. |
| 100 % | Los tres marcos con el logo y sus etiquetas: "Versión principal · Versión corta · Fondo transparente". |

Debajo, en HTML: CTA **Anima tu logo** → `/contacto/?story=03&marca=…&personalidad=…` (mensaje prellenado:
"Vengo de la story «Tu logo ya no puede quedarse quieto». Mi marca: … · Personalidad: …").

## Presupuesto

JS + CSS propios: objetivo < 20 KB comprimidos.
