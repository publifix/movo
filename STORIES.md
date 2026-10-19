# MOVO Stories — Playbook de producción

Este archivo define cómo se crea cada pieza de **MOVO Stories** (`/stories/`) en el sitio www.movomotiondesign.com. Claude Code debe leerlo completo antes de crear o editar cualquier story y seguirlo al pie de la letra. Si algo de este archivo choca con el código existente del sitio, gana el código existente: adapta y reporta la diferencia.

---

## 1. Qué es una story

Una story es un artículo de storytelling **híbrido**: texto real en HTML (lo que lee Google y lo que lee el visitante) acompañado de 3 a 5 escenas de motion graphics hechas con HyperFrames que **viven en el código de la página**. No son videos incrustados.

Objetivo principal: **atraer clientes**. Cada story responde una búsqueda real de alguien que podría contratar a MOVO y termina llevándolo a cotizar.

Objetivo secundario: que explorarla sea una experiencia que el visitante quiera terminar y compartir.

## 2. Concepto creativo: "Nada se queda quieto"

Cada story empieza **quieta** (escala de grises, sin movimiento, timecode en `00:00:00:00`) y gana color, ritmo y movimiento conforme el visitante avanza. El lector pone la historia en movimiento, igual que MOVO pone marcas en movimiento.

### Arco obligatorio en 4 actos

| Acto | Nombre | Qué cuenta | Estado visual |
|---|---|---|---|
| 1 | **Quieto** | El problema o la pregunta del cliente | Congelado, gris, timecode detenido |
| 2 | **Chispa** | El insight, la idea clave | Aparece el primer movimiento y el primer color |
| 3 | **Movimiento** | La solución, explicada y animada | Clímax visual, color completo |
| 4 | **Resultado** | Qué gana el negocio + CTA | Escena final que se asienta y se queda |

El timecode (motivo ya presente en el home y en Servicios) funciona como hilo conductor: avanza conforme avanza la story.

## 3. Reglas de diseño y movimiento

- **Usa el sistema visual existente del sitio.** Lee los tokens de color, tipografía y espaciado del CSS actual. No inventes paleta ni tipografías nuevas.
- **Una idea de movimiento por escena.** Si una escena necesita explicar dos cosas, son dos escenas.
- **El texto nunca vive dentro de la animación.** Todo titular, párrafo y dato que importe está en HTML real; las escenas lo ilustran.
- **Dentro de la story** el scroll puede controlar las escenas (scrub). **En el home nunca** hay scroll-jacking: solo reproducción al entrar en pantalla.
- **Sin parallax decorativo, sin entradas fade-up en cada bloque, sin hover en todo.** El movimiento lo hacen las escenas; el resto de la página es tranquilo.
- **Sin sonido** en las escenas web.
- **`prefers-reduced-motion`:** cada escena muestra su frame final estático (renderizado o en su estado final por CSS). El contenido debe entenderse completo sin animación.
- **Responsive real:** las composiciones se reacomodan en móvil (por ejemplo 16:9 en escritorio y 4:5 en móvil) en vez de solo encogerse.
- **Reservar espacio:** cada escena tiene contenedor con `aspect-ratio` definido para evitar saltos de layout (CLS).

## 4. Reglas técnicas de las escenas (HyperFrames)

- Antes de la primera story, revisa cómo se usó HyperFrames en el hero del sitio y sigue ese mismo patrón.
- Cada escena es una composición HTML/CSS/JS autocontenida con su timeline (GSAP). En la página, la timeline arranca **pausada** y la controla la página: por scroll (dentro de la story) o al entrar en pantalla (teaser del home).
- La misma composición debe poder renderizarse a MP4 con HyperFrames para redes (16:9 y 9:16). El render es opcional y **nunca** es lo que se muestra en la web.
- Inicializa cada escena con `IntersectionObserver` (lazy). Nada de animación corre fuera de pantalla.
- Carga GSAP y cualquier librería una sola vez para toda la página.
- Presupuesto: el JS + CSS propio de las escenas de una story no debe pasar de ~150 KB comprimido. Si se pasa, simplifica.
- Nada de imágenes remotas ni dependencias externas nuevas sin justificarlo.

## 5. Estructura de archivos

Adapta las rutas a la estructura real del repo, pero conserva esta organización:

```
stories/
  _template/                     ← plantilla base de una story
  01-cuanto-cuesta-motion-graphics/
    brief.md                     ← keyword, intención, servicio, CTA (lo aprueba Jerry)
    story.es.md                  ← texto en español + meta SEO
    story.en.md                  ← versión en inglés (adaptada, no literal)
    storyboard.md                ← escenas por acto, con duración y descripción
    scenes/
      01-quieto.html
      02-chispa.html
      03-movimiento.html
      04-resultado.html
    frames/                      ← capturas de validación y frames finales (reduced motion, OG)
    renders/                     ← MP4 opcionales para redes (no se usan en la web)
```

## 6. Flujo de producción (siempre en este orden)

1. **Brief.** Jerry da tema, keyword y la idea visual. Claude Code llena `brief.md`.
2. **Texto + storyboard.** Claude Code redacta `story.es.md` y `storyboard.md`. **Se detiene y espera aprobación de Jerry.** No se anima nada antes de esta aprobación.
3. **Escenas.** Se construyen en HyperFrames usando los tokens del sitio.
4. **Validación por capturas.** Por cada escena: frames en 0 %, 25 %, 50 %, 75 % y 100 % de la timeline, en 375 px, 768 px y 1440 px. Se muestran a Jerry.
5. **Integración.** La story se monta en la plantilla, con SEO completo (sección 8).
6. **Versión en inglés** (`/en/stories/...`), adaptada al mercado de habla inglesa.
7. **Actualizar índice y home:** la story más reciente pasa a ser la destacada en `/stories/` y en el teaser del home.
8. **Commit en rama** `story-XX-slug`. **No hacer merge a main sin aprobación de Jerry.**
9. **Opcional:** render de escenas a MP4 (16:9 y 9:16) en `renders/` para redes.
10. **Después de publicar:** recordar a Jerry enviar la URL a indexar en Search Console.

## 7. Reglas de contenido

- **Idioma principal: español de México.** Tono de MOVO: claro, seguro, cercano, sin relleno ni frases de agencia.
- **Extensión:** 1,000 a 1,500 palabras en español.
- **Estructura:** un H1, H2 por acto (con títulos descriptivos, no "Acto 1"), párrafos cortos, al menos una lista o tabla útil si el tema lo pide.
- **Datos:** nunca inventar precios, cifras, clientes ni resultados. Si falta un dato, marcar `[PENDIENTE: ...]` y avisarle a Jerry.
- **Local:** mencionar Querétaro donde sea natural (no forzado ni repetido).
- **CTA final:** siempre lleva a `/contacto/`, con parámetros cuando aplique (por ejemplo `?story=01&servicio=explainer`) para saber de qué story vino el lead.
- **Enlaces internos:** al menos uno a la sección relevante de `/servicios/` y uno a un proyecto relevante de `/trabajo/`.

## 8. SEO por story (checklist)

- [ ] Slug en español, descriptivo y con la keyword: `/stories/cuanto-cuesta-un-video-motion-graphics/`
- [ ] Slug en inglés para la versión EN: `/en/stories/how-much-does-a-motion-graphics-video-cost/`
- [ ] `<title>` ≤ 60 caracteres: `[Título] · MOVO Stories`
- [ ] Meta description ≤ 155 caracteres, con la keyword
- [ ] Canonical + `hreflang` es-MX / en / x-default (mismo patrón que el resto del sitio)
- [ ] Schema `Article` (autor y publisher: MOVO Motion Design Studio, fechas de publicación y modificación, imagen) + `BreadcrumbList`
- [ ] Imagen OG 1200×630 generada desde el frame final de la escena clave
- [ ] Alt text en todo elemento visual que no sea decorativo; las escenas llevan `aria-label` o descripción equivalente en el texto
- [ ] Entrada en el sitemap (ES y EN)
- [ ] Enlace desde `/stories/` y, si es la más reciente, desde el teaser del home

## 9. Checklist de calidad antes de pedir aprobación

- [ ] El texto se entiende completo con JavaScript desactivado
- [ ] Con `prefers-reduced-motion` se ven los frames finales, sin animación
- [ ] Sin scroll horizontal en 375 px
- [ ] Sin saltos de layout al cargar escenas
- [ ] Ninguna animación corre fuera de pantalla
- [ ] Foco de teclado visible en controles interactivos
- [ ] Capturas de validación mostradas a Jerry
- [ ] Ningún `[PENDIENTE]` sin reportar

## 10. Backlog de stories

| # | Título de trabajo | Servicio que vende | Formato |
|---|---|---|---|
| 01 | ¿Cuánto cuesta un video en motion graphics? | Todos | Cotizador interactivo |
| 02 | Motion graphics para la industria | Explicar y presentar | Proceso industrial animado (ángulo Querétaro) |
| 03 | Tu logo ya no puede quedarse quieto | Marca en movimiento | Un logo cambia de personalidad con el scroll |
| 04 | Anatomía de un reel que detiene el scroll | Contenido y campañas | Página en formato vertical, primeros 3 s cuadro por cuadro |
| 05 | Cómo explicar un producto complejo en 60 segundos | Explicar y presentar | Un explainer se "desarma": guion, storyboard, styleframes, animación |
| 06 | Del brief al render: así trabaja MOVO | Todos (confianza) | El proceso de MOVO, paso a paso |

Orden de publicación: 01, 02, 03, 04, 05, 06.

## 11. Prompt para iniciar una story nueva

Jerry puede iniciar cualquier story nueva con este prompt:

```
Lee STORIES.md completo. Vamos a crear la Story [NÚMERO]: "[TÍTULO]".
Keyword principal: [KEYWORD]
Servicio que vende: [SERVICIO]
Idea visual: [DESCRIPCIÓN BREVE]
Datos reales que puedes usar: [DATOS, CLIENTES, CIFRAS O "ninguno"]

Ejecuta los pasos 1 y 2 del flujo (brief, texto y storyboard) y detente
para que yo apruebe antes de animar.
```
