# Escenas de la Story 01 (el código vive en el sitio)

| Acto | Escena | Composición | Código |
|---|---|---|---|
| 1 · Quieto | Etiqueta gris y quieta, "$?", cifras que aparecen y se borran, timecode en 00:00:00:00 (4 s, scrub) | `s01-still` | `src/stories/scenes/s01-still.js` |
| 2 · Chispa | La etiqueta toma color y se rompe en Duración, Estilo, Formatos y Extras (7 s, scrub; es también la portada del home y del índice) | `s01-cover` | `src/stories/scenes/s01-cover.js` |
| 3 · Movimiento | Cotizador interactivo + mini-pieza que responde en vivo (sin scrub) | quoter + mini | `src/stories/story.js`, `src/stories/quote.js` |
| 4 · Resultado | Tu video al centro y lo elegido como clips en una línea de tiempo (3 s, scrub) | `s01-result` | `src/stories/scenes/s01-result.js` |

Markup: `scripts/i18n/story-scenes.mjs` · estilos: `src/stories/scene.css`, `src/stories/story.css`.
Diferencia con el storyboard: la mini-pieza del cotizador se queda en 16:9 también en móvil (fija arriba mientras
se eligen las opciones; en 4:5 ocuparía casi toda la pantalla). Sus pieles sí se recomponen.
Render a MP4 para redes (opcional): cada composición tiene su timeline en `window.__timelines[id]`.
