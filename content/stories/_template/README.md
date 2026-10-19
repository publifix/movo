# Plantilla de una story (STORIES.md §5)

Copia esta carpeta como `content/stories/<nn>-<slug>/` y llena, en este orden (STORIES.md §6):

1. `brief.md` — keyword, intención, servicio que vende, slugs ES/EN, CTA, enlaces internos, datos reales, [PENDIENTE].
2. `story.es.md` — front matter (slug, title, metaTitle ≤ 60, metaDescription ≤ 155, dek) + texto (1,000–1,500
   palabras; H1, un H2 por acto con título descriptivo). **Se detiene aquí para aprobación de Jerry.**
3. `storyboard.md` — una escena por acto (Quieto, Chispa, Movimiento, Resultado): qué cuenta, qué pasa al
   0/25/50/75/100 %, 16:9 y 4:5, scrub o interacción, frame final (reduced motion / OG).
4. `story.en.md` — versión en inglés adaptada (no literal).
5. `scenes/` — referencia de cada composición; el código vive en `src/stories/scenes/` (ids `sNN-…`).
6. `frames/` — capturas de validación; `renders/` — MP4 opcionales para redes (no se usan en la web).

En el sitio: una entrada nueva AL PRINCIPIO de `src/data/stories.json` (la más reciente se destaca en
`/stories/` y en el home). Después de publicar: enviar las URLs ES y EN a indexar en Search Console.
