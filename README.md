# Portfolio — Alejandro Chávez

Portfolio de desarrollador full-stack e ingeniero de IA. React 19 + TypeScript + Vite.

## Scripts

```bash
pnpm dev       # servidor de desarrollo
pnpm build     # tsc -b + build de producción
pnpm preview   # sirve dist/
pnpm lint      # eslint
```

## Hero

El hero ocupa la pantalla completa con el nombre tratado como tipografía
líquida: los glifos se rasterizan a una textura y un shader WebGL2 los deforma
con un campo de flujo (fbm 3D con domain warping), los arrastra con un smear
direccional y los compone con bloom, sheen y grano.

```
src/components/Hero.tsx        sección a pantalla completa + <h1> real y filtro SVG de fallback
src/components/LiquidName.tsx  ciclo de vida del canvas (React)
src/liquid/nameTexture.ts      tipografiado en canvas 2D: una línea = un ancho completo
src/liquid/shaders.ts          GLSL (vertex + fragment)
src/liquid/renderer.ts         programa, uniforms, loop, calidad adaptativa
src/liquid/look.ts             todos los parámetros del efecto
```

Detalles que importan:

- **El `<h1>` es texto real**, no una imagen: queda para SEO y lectores de
  pantalla, pinta el primer frame y reaparece con un filtro SVG si no hay WebGL2
  o si el navegador pierde el contexto.
- **Todo se mide en unidades de tipografía** (`uTypeScale`), así el efecto
  conserva su proporción con las letras en cualquier relación de aspecto:
  dos líneas en escritorio y móvil, una sola en ultrawide.
- **`prefers-reduced-motion`** renderiza un único frame fijo, sin loop ni
  interacción con el puntero.
- La resolución interna baja sola si la GPU no sostiene ~25 fps, y el loop se
  pausa fuera de pantalla o con la pestaña en segundo plano.

### Calibrar el efecto

Los valores por defecto están en `src/liquid/look.ts` (efecto) y
`src/liquid/nameTexture.ts` (tipografiado). En desarrollo el renderer se expone
en `window.__liquid` para ajustarlo en vivo desde la consola:

```js
__liquid.setLook({ warp: 0.05, smear: 0.04, focus: 3 })
__liquid.setLayout({ tracking: 0.05, blur: 0.04 })
__liquid.setLook({ speed: 0 })   // congela el campo para comparar
__liquid.getLook()               // valores actuales, listos para copiar
```
