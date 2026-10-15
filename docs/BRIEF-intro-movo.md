# MOVO · Intro con sonido y relevo al sitio

Brief técnico para implementar en el sitio de MOVO la intro de bienvenida y su transición invisible al hero. Incluye una implementación de referencia probada (`src/intro.js` + `src/intro.css`) y un demo funcionando (`demo.html`). La tarea es **integrarla al stack del sitio**, no reinventarla.

## Experiencia

1. **Pantalla de entrada.** Fondo `#0B0B10`, la M volt al centro dentro de un anillo que se llena mientras se descarga el video. Al terminar la carga aparecen "Enter" y "Enter without sound". Hacer clic en la M equivale a "Enter".
2. **Entrar.** La M se contrae y se convierte en un punto volt, que es exactamente el frame 0 del video. El video arranca dentro del gesto del clic, así que el navegador permite el sonido.
3. **Intro** (13.4 s): "Great ideas don't sit still." y luego la palabra MOVO, que se arma letra por letra hasta formar el logo. Hay un botón "Skip" desde el segundo 1.2; `Esc` también salta la intro.
4. **Relevo** (≈1.3 s, empieza en 12.5 s): el logo del video se sustituye por su gemelo en SVG, idéntico pixel a pixel. El subtítulo se desvanece, el wordmark vuela a su lugar en el navbar y el fondo de la intro se disuelve. El sitio se desbloquea y el hero arranca.
5. **La cola del audio** sigue sonando con el video oculto. La capa de la intro se elimina del DOM al terminar.

## Archivos

| Archivo | Destino sugerido | Uso |
|---|---|---|
| `assets/video/movo-intro-v2-1920x1080.webm` / `.mp4` | `public/video/intro/` | Intro (WebM VP9+Opus primero, MP4 H.264+AAC de respaldo) |
| `assets/video/movo-hero-1920x1080.webm` / `.mp4`, `movo-hero-poster.jpg` | `public/video/hero/` | Loop del hero, muted, sin audio |
| `assets/logo/movo-logo-completo.svg` | `public/logo/` | Referencia: logo completo en el mismo sistema de coordenadas que el video |
| `assets/logo/movo-wordmark.svg` | `public/logo/` | Navbar y pieza que viaja en el relevo |
| `assets/logo/movo-subtitle.svg` | `public/logo/` | Subtítulo del relevo |
| `assets/logo/movo-M.svg` | `public/logo/` | Pantalla de entrada (también sirve como favicon SVG) |
| `src/intro.js`, `src/intro.css` | módulo del sitio | Implementación de referencia |

Todos los SVG usan `fill="currentColor"`. El color se controla con `color` en CSS (volt `#D7FF3B`).

## Contrato de integración

- El navbar debe tener un elemento `[data-movo-nav-logo]` con el SVG inline de `movo-wordmark.svg`, en color volt. `intro.js` lo oculta durante la intro y lo muestra cuando aterriza el logo. **Debe tener su tamaño y posición finales desde el render inicial**, porque el relevo mide su `getBoundingClientRect()`.
- El contenido principal (`<main>` por defecto, configurable con `mainSelector`) queda con `inert` y el `<html>` con la clase `intro-lock` (sin scroll) durante la intro.
- El sitio escucha `window.addEventListener('movo:intro-done', …)` para arrancar sus animaciones de entrada y hacer `play()` del video del hero. Este evento se emite también en visitas repetidas y con movimiento reducido, así que es el único punto de arranque.
- GSAP 3 debe estar disponible en `window.gsap`. Si el sitio lo importa como módulo, asignarlo: `window.gsap = gsap`.
- Llamada: `initMovoIntro({ base: '/video/intro/', logoBase: '/logo/' })` lo antes posible en el cliente. En frameworks con SSR (Astro, Next), hacerlo en un script de cliente o en un island `client:load`, nunca en el servidor.
- **El fondo de la página debe ser `#0B0B10`**, el mismo negro del video.

## Geometría (no cambiar sin re-renderizar el video)

- Video: 1920×1080. En el último segundo, el logo completo mide **1000 px de ancho, centrado**, en el sistema de coordenadas del SVG de 1981×549.
- Wordmark dentro de ese sistema: `x 3–1978, y 3–446`. Subtítulo: `x 320–1680, y 497–546`.
- Escala del video en pantalla: `cover` si `ancho/alto ≥ 1.3` (`s = max(vw/1920, vh/1080)`), `contain` en pantallas verticales (`s = min(...)`). Logo en pantalla: `1000·s` px de ancho, centrado.
- Punto del frame 0: radio 9 px de video, centrado.
- Validado: el SVG sobre el último frame decodificado coincide pixel a pixel, salvo el antialias de 1 px en los bordes. Los colores decodificados difieren de los oficiales en 1/255, algo imperceptible.

## Tiempos de la intro (por si se sincroniza algo más)

| s | Momento |
|---|---|
| 0–0.95 | Punto latiendo; se estira en línea |
| 0.95–2.67 | GREAT / IDEAS (cortes en cada golpe) |
| 2.67–5.22 | DON'T SIT STILL; silencio total de 4.18 a 5.22 |
| 5.22 | Drop: la frase se parte por el corte diagonal |
| 5.22 / 6.09 / 6.96 / 7.83 | Escenas M / O / V / O; la palabra se arma abajo |
| 8.66–10.13 | MOVO completo, swell |
| 10.13–10.6 | Silencio |
| 10.6 | Golpe final: se forma el logo |
| 12.4–13.4 | Imagen completamente quieta → **relevo en 12.5** |

## Casos borde (ya cubiertos en la referencia)

- **Visita repetida** en la misma sesión (`sessionStorage['movo-intro-seen']`): no hay intro y el navbar se muestra de inmediato. Con `?reset` en la URL del demo se puede volver a ver.
- **`prefers-reduced-motion: reduce`:** no hay intro.
- **Skip o `Esc`:** crossfade del frame actual al logo HTML, fade del volumen en 0.4 s y relevo normal.
- **Carga:** el video se descarga completo con `fetch` (≈3 MB) para que no se corte. Si falla, cae a streaming normal.
- **Redimensionar la ventana** durante la intro recalcula la geometría.

## Pendientes conocidos

- **Móvil vertical:** la intro es 16:9, así que en un teléfono se ve en `contain` con bandas negras arriba y abajo. Se ve correcta porque el negro coincide, pero las escenas de color quedan como una franja. Se recomienda producir una versión vertical 1080×1920 de la intro y elegir el archivo según la orientación.
- **Diseño sonoro:** whooshes e impactos extra sobre la pista. Se integrará al mismo archivo de video, sin cambios de código.
- Considerar servir los videos desde un CDN cuando el sitio esté en producción.

## Checklist de aceptación

- [ ] En el relevo no hay salto visible de posición, tamaño ni color del logo, en 1440×900, 1920×1080 y 2560×1440.
- [ ] El wordmark aterriza exactamente sobre el logo del navbar.
- [ ] Antes del relevo no hay scroll ni foco en el contenido; después, ambos funcionan.
- [ ] El audio suena con "Enter" y no suena con "Enter without sound".
- [ ] El video del hero arranca solo después de `movo:intro-done`.
- [ ] Recargar en la misma sesión va directo al sitio.
- [ ] Safari iOS: `playsinline`, el audio arranca al tocar y se reproduce el MP4 si el WebM no está soportado.
