# HANDOFF — Portfolio v3 (Alejandro Chávez)

> Documento para continuar en una sesión nueva. Todo lo de aquí está **verificado y en disco** salvo lo marcado como PENDIENTE. Comunicación con el usuario: **español con acentos correctos**. Rama: `v3`. Repo: `C:\Users\Alejandro\dev\portfolio`.
> El **usuario corre el dev server** (`localhost:5173`) — NO lo levantes. Verificación visual con Playwright MCP (`browser_navigate`, `browser_evaluate` + `window.scrollTo`, `browser_take_screenshot` + `Read` del png). Las capturas deben guardarse dentro del repo (p. ej. `.playwright-mcp/x.png`); fuera de ahí Playwright lo rechaza. Recargá con `browser_navigate` cuando el HMR deje estado a medias.

## Stack
Vite 8 (rolldown) + React 19 (React Compiler activo en `vite.config.ts`) + TypeScript + Three.js 0.186 + @react-three/fiber 9 + @react-three/drei 10.7. pnpm. Verificar siempre con `npx tsc --noEmit` (debe dar exit 0).

## Arquitectura (`src/components/`)
- `SiteBackdrop.tsx` — **fondo único y fijo de toda la página** (2026-09-29, a pedido del usuario: el fondo debe quedar estático en todas las secciones como en el hero). Canvas `position: fixed; z-index: -1` con color `#050506` + `Sparkles`, lazy desde `App.tsx`. El canvas de `World` es transparente (`alpha: true`, sin `<color>` ni Sparkles en `WorldScene`) y `.world`, `.tstack` y `.xp` no pintan fondo. Reemplaza al antiguo `TechBackdrop.tsx`.
- `World.tsx` — wrapper del `<Canvas>` (cámara `[0,0,6]`, fov 42) + overlay DOM + interacción (scroll→progress, paneo, tooltip, panel de detalle). `dpr={[1, QUALITY.maxDpr]}`, `frameloop={past?'never':'always'}`.
- `WorldScene.tsx` — composición 3D: `<HeroRig/>` + `<AboutMarquee/>` + Sparkles + Environment. Maneja la salida del hero.
- `HeroRig.tsx` — piezas del hero. NO tocar salvo pedido.
- `AboutMarquee.tsx` — sección "Sobre mí" (barril). **Terminada y aprobada por el usuario**, ver abajo.
- `ProjectsCollage.tsx` + `.css` — **sección Proyectos rediseñada (2026-09-29, BASE en progreso)**: collage DOM sobre el canvas, ref **studiofreight.com** (cuadrícula dispersa, título al centro). Tiles = "ventanas OS Y2K" redondeadas con borde cromado, barra con 3 puntos azul/rosa/crema, host y número; decor Y2K (estrella cromada, badge circular giratorio, contador "09 ONLINE", barra "Loading work…"). Entrada escalonada por `data-active` (fase `field`), parallax por scroll (`--t`) y puntero (`--mx/--my`) que escribe `World.tsx`. Hover base: lift + borde conic giratorio + scanlines + glitch RGB del ícono + atenúa el resto. Click → panel `.detail`. **Hover/click definitivos: pendientes de decidir con el usuario.**
- `y2k.tsx` + `y2k.css` — **ornamentos Y2K compartidos** (About + Proyectos): `ChromeStar`, `RingBadge`, `SegLoader`, `WindowDots`, `Blink` y la clase `.y2k-chrome` (título Anton con degradado cromado; `padding-top` para que se pinten las tildes). Paleta `--blue/--pink/--cream/--rim/--mono` en `:root` (`index.css`).
- `AboutHud.tsx` + `.css` — overlay Y2K de "Sobre mí" (2026-09-29): título cromado "SOBRE MÍ✦", dos estrellas, scanlines CRT + viñeta. El usuario pidió **quitar** el chip `about_me.exe`, el subtítulo "01 — Quién soy", el panel "Loading profile" y el sello circular; no volver a ponerlos. Reemplaza al antiguo `.world__about`.
- `TechStack.tsx` + `.css` + `techData.ts` — **sección Tech Stack (2026-09-29)**: minijuego "Stack Invaders" en canvas 2D dentro de una pantalla con borde cromado (sin barra de título estilo macOS: el usuario la pidió quitar; el contador "Unlocked" va en la fila del inventario), montado en `App.tsx` después de `<World/>` (fuera del canvas 3D). 20 bloques estáticos (2 impactos c/u) con el logo de cada tech (Simple Icons en `/public/tech/`; Java viene de Devicon `java-plain` con los `fill` quitados, teñido con su color y brillo precalculado en un canvas aparte); al destruirlos aparece el nombre en cromo con glitch RGB y se desbloquea el chip del inventario. Mouse mueve + click dispara; ← → / A D mueven, Espacio / ↑ disparan (solo tras interactuar; Esc suelta). Botón "Play again" (el "Reveal all" se quitó a pedido del usuario; no volver a ponerlo). El cursor se oculta mientras se juega y reaparece solo en la pantalla "Stack complete". El loop solo corre con la sección visible (IntersectionObserver). **Transición CRT por scroll**: `.tstack` mide 300svh con `.tstack__pin` sticky; entra como punto → línea brillante → pantalla (título baja con split RGB) y sale al revés. Vars `--sx/--sy/--beam/--fade/--ti/--lift` escritas desde `TechStack.tsx`; el canvas mide con `clientWidth/Height` para ignorar el `scale`. Fondo: el `SiteBackdrop` fijo global.
- `Experience.tsx` + `.css` + `experienceData.ts` — **sección Experiencia (2026-09-29, BASE)**: timeline zig-zag (izq/der) de estuches de CD en CSS 3D, del más reciente al más antiguo (Botinfy Dev Manager → Botinfy AI Agent Dev → Freelance → UJAP; datos de LinkedIn salvo el freelance). Con el scroll cada estuche se abre (`--o`), la tapa gira sobre el lomo, el disco sale hacia la línea central (`--d`) y gira (`--rot` + animación). Al lado, ventana OS con "liner notes" (cargo, fechas, logros como tracklist, tags). Decor Y2K con parallax (`--py`), línea con cabezal brillante (`--p`), píldora sticky "Reading disc 0X/04". Fondo: el `SiteBackdrop` fijo global (la sección solo añade una viñeta en una capa sticky; las scanlines se quitaron a pedido del usuario). Móvil: una columna, tapa con bisagra arriba. Logos: `/icons/botinfy.png`, `/public/xp/ujap.png` (Wikimedia, fondo quitado), `/public/xp/freelance.svg`. Montada en `App.tsx` después de `<TechStack/>`.
- `collageLayout.ts` — posiciones del collage: desktop 7×5 (`d`) y móvil 3×7 (`m`), `depth` de parallax, `entryOrder`. Pickop y Roda son 2×2 (featured).
- Los orbes 3D (`FieldOrb.tsx`, `fieldLayout.ts`, `iconTextures.ts`) y las flechas de paneo/tooltip **se eliminaron**. `projectsData.ts` ganó `accent` (tinte del tile) y `cover?` (captura opcional; si existe reemplaza al ícono).
- `choreography.ts` — ventanas de scroll (una sola fuente de verdad): `track(p,a,b)` y `HERO_OUT=[0.03,0.11]`, `ABOUT_IN=[0.14,0.22]`, `ABOUT_OUT=[0.34,0.42]`, `FIELD_IN=[0.47,0.57]`, `FIELD_OUT=[0.86,0.96]`.
- `quality.ts` — calidad por dispositivo (`maxDpr`, `samples`, `resolution`, `sparkles`, `transmissionSampler`).
- `iconTextures.ts` — `makeGlowTexture` y `makeRoundedMask`.
- `projectsData.ts` — los 9 proyectos con `icon` (en `/public/icons/`).
- `Loader.tsx` + `Loader.css` — loader DOM mientras carga el chunk 3D (lazy desde `App.tsx`).
- `World.css` — overlay (`.world` 440vh, `.world__pin` sticky, títulos por fase, flechas `.world__nav`, panel `.detail`).

## Fases del scroll (sección `.world` de 440vh, sticky)
`progress` 0..1. `p<0.13` → `name` (hero), `0.13–0.45` → `about` (barril + título "SOBRE MÍ / 01 — Quién soy"), `0.45–0.93` → `field` (collage de proyectos, título dentro del collage), `>0.93` → `none`.

Para saltar a una fase en el navegador (viewport 1440×900):
```js
const el=document.querySelector('.world'); const total=el.offsetHeight-window.innerHeight;
window.scrollTo(0, Math.round(total*0.25)); // about (hero ~0, proyectos ~0.65)
```

## `AboutMarquee.tsx` — cómo funciona (estado final)
Referencia visual: **https://ham7a311.dev** (sección "ledger"). Efecto: texto pegado a la **pared interna de un barril**, que entra por la derecha y sale por la izquierda con el scroll.

- **Cilindro vertical real con la cámara adentro.** Constantes: `R = 7`, `AXIS_Z = 0` (eje del barril; la cámara en z=6 queda detrás del eje, cerca de la pared frontal → el centro se ve lejos/chico y los laterales cerca/grandes).
- Cada columna (`Segment`) está en el ángulo `θ = arco / R`: `position = (R·sinθ, 0, −R·cosθ)`, `rotation.y = −θ` (mira al eje). Oculta si `|θ| > CULL (2.2)`.
- El texto se dobla con el mismo radio: `curveRadius={R}` (positivo = cóncavo, pegado a la pared). Para columnas planas rígidas bastaría quitarlo.
- `STRETCH = 1.35`: escala Y de cada columna (letra alta tipo póster).
- **Una sola pasada, sin loop ni repetición.** `t = track(p, ABOUT_IN[0], ABOUT_OUT[1])` y `off = start + (end − start)·t`: al inicio la 1.ª columna está justo fuera por la derecha; al final la última salió por la izquierda.
- **Sin animación de entrada/salida del grupo** (el usuario no quería el efecto de "cámara que se aleja"). El grupo está fijo en `[0, −1.2, AXIS_Z]`; solo se oculta fuera de la ventana.
- `edgeAngle(camZ, fov, aspect)` calcula dónde corta la pared el borde lateral de la pantalla → `start/end` se adaptan al aspect ratio (móvil incluido).
- Datos (4 columnas, colores fijos azul/rosa/crema — NO cambiar a verde/naranja):
  1. `3+` / YEARS OF EXPERIENCE (`#8bb8ff`)
  2. `20+` / PROJECTS IN PRODUCTION (`#ff8fd0`)
  3. FULL STACK DEVELOPER / AI & COMPUTER ENGINEER (`#f6ecd4`)
  4. FROM VENEZUELA / BORN IN CCS · NOW IN VALENCIA (`#f6ecd4`)
  Tamaños: números 3.0, palabras 1.35, etiquetas 0.5. `width` por columna estimado a ojo para Anton (4.2 / 5.6 / 7.2 / 7.2), `GAP = 1.2`.

**Detalles Y2K dentro del barril (2026-09-29):** sombra desplazada de contraste en los textos grandes (`outlineOffsetX/Y 3.5%`, mapa `SHADOW`), leve brillo neón en las etiquetas y estrellas cromadas 3D (`Spark`, extrusión metálica) en los huecos entre columnas. Los índices `[ 01 / 04 ]` se probaron y el usuario pidió quitarlos. Se probó un material "cromo tintado" y se descartó porque deslavaba los colores. La geometría aprobada (R, AXIS_Z, STRETCH) NO se tocó.

**Perillas de ajuste:** `STRETCH` (alargamiento), `R` y `AXIS_Z` (intensidad del barril: más chico/más negativo = más exagerado), `bigSize`/`labelSize` (tamaño). Historial de calibración: `R=5.5, AXIS_Z=-2.5, STRETCH=1.7` resultó **demasiado** intenso/alargado; `R=9, AXIS_Z=3, sin stretch` quedó **demasiado** suave. El valor actual es el aprobado.

## Completado en sesiones anteriores
1. 9 proyectos reales en `projectsData.ts` con demo/repo.
2. Íconos de apps dentro de cada orbe (optimizados a 256px en `/public/icons/`; Roda usa `roda-v3.svg`).
3. Campo de proyectos con paneo horizontal (flechas glass ‹ ›, hover/hold).
4. Limpieza y modularización (11 archivos muertos borrados).
5. Optimización: íconos 1.65MB→85KB, fuente Anton subseteada (TTF, mismo path), JS inicial 1.33MB→214KB (three/drei en chunk lazy `vendor-three`), Loader, cap de DPR. Reflejos de los orbes restaurados en desktop (`transmissionSampler` OFF); en móvil sampler compartido.
6. Sección "Sobre mí" (barril) — terminada esta sesión.

## PENDIENTES
- **Commit + push a `v3`** de todo el bloque (proyectos + íconos + paneo + limpieza + optimización + "Sobre mí"). No se ha comiteado nada desde `b9e89c4`. Solo cuando el usuario lo pida.
- Campo **`contribution`** por proyecto (el panel de detalle tiene el placeholder "Mi aporte: …").
- **Capturas reales** en el preview del panel de detalle (hoy es placeholder con dominio + "Abrir sistema ↗").
- Drinkers: la demo `drinkers-ve.onrender.com` suele estar dormida.
- Borrar este `HANDOFF.md` y la carpeta `.playwright-mcp/` (capturas de verificación) cuando ya no hagan falta; no comitearlos.

## Ronda responsive + i18n (2026-09-29, verificada con Playwright en 390×844 táctil, 844×390 táctil, 768×1024 táctil y 1440×900)
- **Bilingüe ES/EN**: `src/i18n.ts` (store de módulo, funciona dentro del Canvas): `useLang()`, `useCopy({es,en})`, tipo `L10n`, `setLang()`. Idioma inicial: `?lang=` → localStorage → navegador. **Selector pendiente: irá en el menú.** En dev: `setLang('en')` en consola. Datos (`projectsData`, `experienceData`, `techData`) con campos `L10n`; fechas de experiencia en formato `'2025-12'` + `fmtRange()`.
- Tokens en `index.css`: `--fs-display/h2/body/small/meta` (0.72rem = piso de texto informativo), `--faint`. Breakpoints: ≤720 móvil, 721–1024 tablet, `(max-height:500px)` móvil horizontal. `quality.ts` usa 720px + coarse, tope de píxeles, `segments`, `envResolution`, `isMobile`.
- `useReducedMotion.ts` (hook compartido, también en R3F).
- Hero: el rig escala al ancho visible (nombre legible en móvil). Barril: tamaños escalados por aspect (R/AXIS_Z/STRETCH intactos). HUD con lista sr-only de los datos.
- Proyectos: meta del tile siempre visible en `(hover:none)` (en ≤720 sin rol); layout tablet 5×6 (campo `t` en collageLayout); móvil horizontal = tira con scroll-snap; esquina sup. derecha libre para el menú (Mediart → [7,2]). Panel = `<dialog>` nativo (foco, Escape, click fuera, ‹ › + ←/→ + swipe, foco vuelve al tile). `contribution` redactado por Claude → **validar con el usuario** (`// DRAFT`).
- Tech Stack: chips con nombre siempre visible (atenuado hasta desbloquear), táctil sin disparos accidentales, hint por tipo de input, cabe en pantallas bajas, 240svh en móvil.
- Experiencia: píldora "Reading disc" **eliminada** (pedido del usuario); una columna también en tablet/horizontal; CD decorativo `aria-hidden`; fechas/cargo/lugar más grandes; nodo del año arriba de cada entrada.
- `tsc -b` limpio; eslint: 4 errores preexistentes (mutaciones en useFrame, react-hooks/immutability).
- **Menú (2026-09-29, hecho):** `sections.ts` (offset de cada sección, incluidas las fases pinned; `goToSection`, `currentSection`, deep links `#projects` etc. con replaceState). El nav lista `/home /about-me /projects /tech-stack /experience` (slugs fijos + etiqueta bilingüe); la `/` es un glifo de 3 barras cromadas que se transforma en flecha → en hover/focus/click, glitch RGB en el texto, highlight de vidrio; click = la flecha "dispara" 260ms, salto instantáneo bajo el vidrio y cierre genie. Sección actual en rosa + punto. Focus trap, `inert` cerrado, safe-area del botón, hover solo con `(hover:hover)`.
- **Pendiente (orden del usuario):** renovar el panel de detalle de proyecto, (selector de idioma: hecho). También: lock de scroll compartido (Menu/World pisan `body.style.overflow`).
- **Contacto (2026-09-29, hecho):** `Contact.tsx/.css`, montada tras Experiencia; título cromado "Contact me" (literal, igual en ES/EN a pedido del usuario) + 4 botones circulares cromados de 52px: GitHub (alejandrochmejia), LinkedIn (/in/alejandrochmejia), Instagram (@alejandrochmejia), email (alejandrochmejia@gmail.com). `/contact` en el menú. El usuario la pidió super sencilla: no añadir más.
- **Selector de idioma (2026-09-29, hecho):** píldora `.menu__lang` ES / EN arriba a la izquierda del menú (espejo del botón cerrar), botón activo en cromo, `aria-pressed`. `setLang` guarda en localStorage y sincroniza `?lang=` si está en la URL. Los logos de contacto también están en el menú (`ContactLinks`, compartido con Contact).
- **Panel de proyecto = escritorio Y2K multiventana (2026-09-29):** `ProjectDesktop.tsx/.css` dentro del `<dialog>` de World (a11y/navegación conservadas). Ventanas `screens.exe` (navegador/teléfono con auto-scroll de capturas de página completa), `my_role.log` (highlights con tipeo), `stack.sys`, `links.url`; arrastrables, al frente al tocar, doble click maximiza, "–" minimiza a chip. Modos por `data-mode`: desk (≥1025), grid (tablet), tabs (≤720 o alto ≤500; abre la captura móvil).
- Capturas en `public/projects/<slug>/{desktop,mobile}.webp` registradas en `projectShots.ts` (Playwright 1440/390, recorte + WebP). Pickop = frames unidos (landing scroll-driven). Drinkers: demo muerta (Render Not Found) → imagen del README. **Sin capturas: Pago Móvil Manager y Restaurant System** (el usuario debe aportarlas).
- `projectsData.ts`: `highlights` (3–5, ES/EN) y `stack` reales investigados por repo/bundle; `// ? …` con dudas por proyecto. **Validar con el usuario**: años vs. commits, si encuentralosvzla.com actual es su proyecto, alcance real en Bistrot/Drinkers.
- Ojo: `@property` es global — el del menú se llama `--glyph-len` (chocaba con `--len` del panel).
- **Genie en el panel de proyecto (2026-09-29):** `World.tsx` crea un genie (560ms, lineal, `direction:auto`) con target = el `<dialog>` y origin = el tile (`.tile[data-index]`); cierre = `hide()` hacia el tile del proyecto en pantalla y luego `dialog.close()`. Snapshot pintado a mano en `desktopGenie.ts` (`captureDesktop`: ventanas en su rect real, imágenes recortadas a su visor, textos) porque genie no captura backdrop-filter. El dialog arranca `visibility:hidden` y aparece con fundido al 72%; el foco se da recién ahí (un elemento oculto no acepta foco).
- Charlotte Bistró: confirmado 2024, Analista Programador (requisitos, modelado UML/ER, pruebas, documentación; NO programó el módulo de KPIs — AleC2111 no es él). Se mantienen repo, demo y capturas.

## SEO (2026-09-30)

- `src/seo/site.ts`: dominio (`SITE_URL = https://alejandrochmejia.com`), persona, perfiles y meta por idioma. Fuente única para runtime y build.
- `src/seo/render.ts` + `vite-plugin-seo.ts`: en build llenan los slots `<!--seo:head-->` / `<!--seo:body-->` de `index.html` (title, description, canonical, hreflang, OG/Twitter, JSON-LD Person/WebSite/ProfilePage/ItemList y una copia HTML estática del contenido dentro de `#root`), y emiten `en/index.html`, `sitemap.xml`, `robots.txt`.
- Idioma por URL: `/` = es, `/en/` = en (`i18n.ts`). Crawlers nunca se desvían del idioma de la URL; humanos en `/` con navegador/elección en inglés pasan a `/en/` (replaceState). `?lang=` sigue funcionando y se normaliza.
- Tipos `Lang`/`L10n` en `src/l10n.ts` (sin DOM) para que el build importe los data files; facts de "Sobre mí" en `aboutData.ts`.
- `public/og.png` (captura del hero 1200×630), iconos PNG + `site.webmanifest`.
- React en chunk propio (`vendor-react`): three.js ya no se precarga en el HTML inicial.
- Al añadir/editar proyectos, experiencia o tech, el HTML estático y el JSON-LD se regeneran solos.
