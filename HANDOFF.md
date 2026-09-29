# HANDOFF — Portfolio v3 (Alejandro Chávez)

> Documento para continuar en una sesión nueva. Todo lo de aquí está **verificado y en disco** salvo lo marcado como PENDIENTE. Comunicación con el usuario: **español con acentos correctos**. Rama: `v3`. Repo: `C:\Users\Alejandro\dev\portfolio`.
> El **usuario corre el dev server** (`localhost:5173`) — NO lo levantes. Verificación visual con Playwright MCP (`browser_navigate`, `browser_evaluate` + `window.scrollTo`, `browser_take_screenshot` + `Read` del png). Las capturas deben guardarse dentro del repo (p. ej. `.playwright-mcp/x.png`); fuera de ahí Playwright lo rechaza. Recargá con `browser_navigate` cuando el HMR deje estado a medias.

## Stack
Vite 8 (rolldown) + React 19 (React Compiler activo en `vite.config.ts`) + TypeScript + Three.js 0.186 + @react-three/fiber 9 + @react-three/drei 10.7. pnpm. Verificar siempre con `npx tsc --noEmit` (debe dar exit 0).

## Arquitectura (`src/components/`)
- `World.tsx` — wrapper del `<Canvas>` (cámara `[0,0,6]`, fov 42) + overlay DOM + interacción (scroll→progress, paneo, tooltip, panel de detalle). `dpr={[1, QUALITY.maxDpr]}`, `frameloop={past?'never':'always'}`.
- `WorldScene.tsx` — composición 3D: `<HeroRig/>` + `<AboutMarquee/>` + Sparkles + Environment. Maneja la salida del hero.
- `HeroRig.tsx` — piezas del hero. NO tocar salvo pedido.
- `AboutMarquee.tsx` — sección "Sobre mí" (barril). **Terminada y aprobada por el usuario**, ver abajo.
- `ProjectsCollage.tsx` + `.css` — **sección Proyectos rediseñada (2026-09-29, BASE en progreso)**: collage DOM sobre el canvas, ref **studiofreight.com** (cuadrícula dispersa, título al centro). Tiles = "ventanas OS Y2K" redondeadas con borde cromado, barra con 3 puntos azul/rosa/crema, host y número; decor Y2K (estrella cromada, badge circular giratorio, contador "09 ONLINE", barra "Loading work…"). Entrada escalonada por `data-active` (fase `field`), parallax por scroll (`--t`) y puntero (`--mx/--my`) que escribe `World.tsx`. Hover base: lift + borde conic giratorio + scanlines + glitch RGB del ícono + atenúa el resto. Click → panel `.detail`. **Hover/click definitivos: pendientes de decidir con el usuario.**
- `y2k.tsx` + `y2k.css` — **ornamentos Y2K compartidos** (About + Proyectos): `ChromeStar`, `RingBadge`, `SegLoader`, `WindowDots`, `Blink` y la clase `.y2k-chrome` (título Anton con degradado cromado; `padding-top` para que se pinten las tildes). Paleta `--blue/--pink/--cream/--rim/--mono` en `:root` (`index.css`).
- `AboutHud.tsx` + `.css` — overlay Y2K de "Sobre mí" (2026-09-29): título cromado "SOBRE MÍ✦", dos estrellas, scanlines CRT + viñeta. El usuario pidió **quitar** el chip `about_me.exe`, el subtítulo "01 — Quién soy", el panel "Loading profile" y el sello circular; no volver a ponerlos. Reemplaza al antiguo `.world__about`.
- `TechStack.tsx` + `.css` + `techData.ts` — **sección Tech Stack (2026-09-29)**: minijuego "Stack Invaders" en canvas 2D dentro de una ventana OS Y2K, montado en `App.tsx` después de `<World/>` (fuera del canvas 3D). 20 bloques estáticos (2 impactos c/u) con el logo de cada tech (Simple Icons en `/public/tech/`; Java viene de Devicon `java-plain` con los `fill` quitados, teñido con su color y brillo precalculado en un canvas aparte); al destruirlos aparece el nombre en cromo con glitch RGB y se desbloquea el chip del inventario. Mouse mueve + click dispara; ← → / A D mueven, Espacio / ↑ disparan (solo tras interactuar; Esc suelta). Botón "Play again" (el "Reveal all" se quitó a pedido del usuario; no volver a ponerlo). El cursor se oculta mientras se juega y reaparece solo en la pantalla "Stack complete". El loop solo corre con la sección visible (IntersectionObserver). **Transición CRT por scroll**: `.tstack` mide 300svh con `.tstack__pin` sticky; entra como punto → línea brillante → pantalla (título baja con split RGB) y sale al revés. Vars `--sx/--sy/--beam/--fade/--ti/--lift` escritas desde `TechStack.tsx`; el canvas mide con `clientWidth/Height` para ignorar el `scale`. Fondo: `TechBackdrop.tsx` (lazy, reutiliza `vendor-three`) = mismo color + `Sparkles` que `WorldScene`, con `frameloop` solo mientras la sección está en pantalla.
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
