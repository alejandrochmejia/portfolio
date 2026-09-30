import type { L10n } from '../l10n.ts'

export type Project = {
  title: string
  role: L10n
  year: string
  blurb: L10n
  /** "My contribution" paragraph in the detail panel (hidden when missing). */
  contribution?: L10n
  /** 3–5 achievements ("verb + result"), shown as the my_role.log tracklist. */
  highlights?: L10n[]
  stack: string[]
  /** App icon shown inside its glass orb (path under /public). */
  icon: string
  /** Tile tint in the projects collage (matches the icon's dominant colour). */
  accent: string
  /** Optional screenshot/cover (path under /public). Falls back to the icon. */
  cover?: string
  demo?: string
  repo?: string
}

const same = (s: string): L10n => ({ es: s, en: s })

/** The projects shown in the collage, in display order (their position in the
 *  grid lives in `collageLayout.ts`, keyed by index). */
// DRAFT: validar con Alejandro — `blurb`, `contribution`, `stack` y `highlights`
// salen de los repos públicos y de las demos (HTML/bundles); los `// ?` marcan dudas.
export const PROJECTS: Project[] = [
  // ? Repo privado: stack deducido de los bundles de pickop.app (landing) y
  //   platform.pickop.app (panel). La IA (OpenAI) y la facturación salen del código cliente.
  {
    title: 'Pickop',
    role: same('Full-Stack'),
    year: '2026',
    blurb: {
      es: 'SaaS para restaurantes: pedidos por WhatsApp y tienda online con un solo menú y una sola cola.',
      en: 'SaaS for restaurants: WhatsApp and online-store orders with one menu and a single queue.',
    },
    contribution: {
      es: 'Desarrollé el sistema de punta a punta: del frontend al backend y su puesta en producción.',
      en: 'I built the system end to end: from the frontend to the backend and its release to production.',
    },
    highlights: [
      {
        es: 'Construí un SaaS multi-tenant para que cada restaurante venda por WhatsApp y por su propia tienda.',
        en: 'I built a multi-tenant SaaS so each restaurant can sell through WhatsApp and its own online store.',
      },
      {
        es: 'Unifiqué los pedidos de ambos canales en una sola cola en vivo, marcados por canal de origen.',
        en: 'I merged orders from both channels into one live queue, each tagged with its source channel.',
      },
      {
        es: 'Integré la API oficial de WhatsApp Business con un asistente de IA que escala a una persona.',
        en: 'I integrated the official WhatsApp Business API with an AI assistant that hands off to a human.',
      },
      {
        es: 'Diseñé un menú único para los dos canales: un plato agotado desaparece de ambos a la vez.',
        en: 'I designed a single menu for both channels: a sold-out dish disappears from both at once.',
      },
      {
        es: 'Implementé horarios, feriados y pedidos agendados, con respuesta automática fuera de hora.',
        en: 'I added opening hours, holidays and scheduled orders, with automatic replies after hours.',
      },
    ],
    stack: ['Next.js', 'React', 'Supabase', 'WhatsApp Business API', 'OpenAI', 'Tailwind CSS', 'GSAP'],
    icon: '/icons/pickop.png',
    accent: '#7fdc6a',
    demo: 'https://pickop.app',
  },
  // ? Repo privado: stack deducido de roda.club (React + Vite) y app.roda.club (Next.js).
  //   No pude ver el backend ni cómo se implementa el modo sin conexión.
  {
    title: 'Roda',
    role: same('Full-Stack'),
    year: '2026',
    blurb: {
      es: 'Sistema para talleres mecánicos: recepción con fotos, cotizaciones, cobro e historial, con o sin internet.',
      en: 'Auto repair shop system: photo check-in, quotes, billing and history, online or offline.',
    },
    contribution: {
      es: 'Me encargué del producto completo, desde la interfaz hasta la lógica de servidor, y de mantenerlo en producción.',
      en: 'I owned the whole product, from the interface to the server-side logic, and kept it running in production.',
    },
    highlights: [
      {
        es: 'Construí un flujo offline-first para que el taller siga trabajando sin señal y sincronice al volver.',
        en: 'I built an offline-first flow so the shop keeps working without signal and syncs when back online.',
      },
      {
        es: 'Diseñé la recepción del vehículo con fotos, daños marcados y firma para cortar las disputas.',
        en: 'I designed vehicle check-in with photos, marked damage and a signature to settle disputes early.',
      },
      {
        es: 'Implementé cotizaciones que el cliente aprueba línea por línea desde un link, sin iniciar sesión.',
        en: 'I built quotes the customer approves line by line from a link, without logging in.',
      },
      {
        es: 'Registré la tasa del día en cada cobro y separé IVA e IGTF para que el cierre de caja cuadre.',
        en: "I stored the day's exchange rate on each payment and split VAT and IGTF so the till balances.",
      },
      {
        es: 'Armé el historial por vehículo y el estado de cada bahía para asesores y clientes.',
        en: 'I built per-vehicle history and a live status of every bay for advisors and customers.',
      },
    ],
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vite'],
    icon: '/icons/roda-v3.svg',
    accent: '#ff8a3d',
    demo: 'https://roda.club',
  },
  // ? Repo privado. El subdominio vivo es demo.botinfy.com (demos.botinfy.com no responde).
  //   "Carga diferida de terceros" aparece en el bundle; confirmar que lo hizo Alejandro.
  {
    title: 'Botinfy.com',
    role: { es: 'Landing · Demos', en: 'Landing · Demos' },
    year: '2025',
    blurb: {
      es: 'Landing de Botinfy, empresa de IA empresarial, y su sitio de demos (demo.botinfy.com).',
      en: 'Landing page for Botinfy, an enterprise AI company, and its demos site (demo.botinfy.com).',
    },
    contribution: {
      es: 'Construí la landing de la empresa y el sitio de demos donde se muestran los productos a clientes.',
      en: "I built the company's landing page and the demos site used to show the products to clients.",
    },
    highlights: [
      {
        es: 'Construí la landing corporativa en React con animaciones en GSAP y metadatos SEO/Open Graph.',
        en: 'I built the corporate landing in React with GSAP animations and SEO/Open Graph metadata.',
      },
      {
        es: 'Estructuré la presentación de los cinco productos de la empresa bajo un mismo núcleo.',
        en: "I structured the presentation of the company's five products around a single core.",
      },
      {
        es: 'Difiero la carga de analítica y píxeles de terceros para no penalizar el rendimiento.',
        en: 'I deferred third-party analytics and pixels so they do not hurt page performance.',
      },
      {
        es: 'Desarrollé en Next.js el sitio de demos, con un onboarding por sector: e-commerce, retail o industrial.',
        en: 'I built the demos site in Next.js, with an onboarding flow per sector: e-commerce, retail or industrial.',
      },
    ],
    stack: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'GSAP', 'Radix UI'],
    icon: '/icons/botinfy.png',
    accent: '#4b4bff',
    demo: 'https://botinfy.com',
  },
  // ? El sitio vivo hoy es "Encuentra un Niño — Emergencia Sismo" (React + Supabase); no cuadra
  //   con el año 2024. Confirmar si es el mismo proyecto y qué partes del backend fueron suyas.
  //   Tablas `reportes`/`reportes_publicos` y Edge Functions `crear-reporte`/`revelar-contacto`
  //   vistas en el bundle; la validación de Turnstile en servidor es una suposición.
  {
    title: 'Encuéntralos VZLA',
    role: { es: 'Backend · Datos', en: 'Backend · Data' },
    year: '2024',
    blurb: {
      es: 'Plataforma de emergencia para reportar y localizar niños durante un sismo en Venezuela.',
      en: 'Emergency platform to report and locate children during an earthquake in Venezuela.',
    },
    contribution: {
      es: 'Trabajé en el backend: el modelado de la base de datos y el manejo de la información que alimenta el sitio.',
      en: 'I worked on the backend: modelling the database and handling the data behind the site.',
    },
    highlights: [
      {
        es: 'Modelé en Supabase la base de reportes, separando la vista pública de los datos de contacto.',
        en: 'I modelled the reports database in Supabase, keeping the public view apart from contact data.',
      },
      {
        es: 'Implementé Edge Functions para crear reportes y revelar el contacto solo cuando se solicita.',
        en: 'I built Edge Functions to create reports and reveal contact details only on request.',
      },
      {
        es: 'Validé los envíos con Cloudflare Turnstile para frenar spam y reportes automatizados.',
        en: 'I validated submissions with Cloudflare Turnstile to stop spam and automated reports.',
      },
    ],
    stack: ['Supabase', 'PostgreSQL', 'React', 'Cloudflare Turnstile'],
    icon: '/icons/encuentralos.svg',
    accent: '#ff4d4d',
    demo: 'https://encuentralosvzla.com',
  },
  // ? Sus 46 commits son de jun–ago 2025. Stack del proyecto; su parte fue
  //   el cliente Nuxt/Vue, las pruebas y la CI.
  {
    title: 'Mediart',
    role: { es: 'Soporte de desarrollo', en: 'Dev Support' },
    year: '2025',
    blurb: {
      es: 'Plataforma multimedia para organizar música, películas, series, libros y videojuegos en playlists.',
      en: 'Media platform to organise music, films, series, books and video games into playlists.',
    },
    contribution: {
      es: 'Apoyé al equipo en el desarrollo: resolviendo problemas puntuales y ayudando a sacar funcionalidades adelante.',
      en: 'I supported the team during development, fixing specific issues and helping ship features.',
    },
    highlights: [
      {
        es: 'Monté la suite de pruebas con Vitest, con mocks de Nuxt, localStorage y fetch.',
        en: 'I set up the Vitest test suite, with mocks for Nuxt, localStorage and fetch.',
      },
      {
        es: 'Configuré ESLint y un workflow de GitHub Actions que corre pruebas y lint en cada cambio.',
        en: 'I configured ESLint and a GitHub Actions workflow that runs tests and lint on every change.',
      },
      {
        es: 'Añadí manejo de errores en la carga de fotos de perfil en seis vistas para no romper la UI.',
        en: 'I added error handling for profile picture loading across six views so the UI never breaks.',
      },
      {
        es: 'Ajusté el diseño móvil y la navegación de Studio para que la app fuera usable en teléfono.',
        en: 'I reworked the mobile layout and Studio navigation so the app works well on phones.',
      },
      {
        es: 'Pulí la interactividad de botones y selectores en Studio, Search, Profile y Library.',
        en: 'I polished the interactivity of buttons and selects across Studio, Search, Profile and Library.',
      },
    ],
    stack: ['Nuxt', 'Vue', 'Tailwind CSS', 'Vitest', 'GitHub Actions', 'Express', 'PostgreSQL'],
    icon: '/icons/mediart.png',
    accent: '#ff8fd0',
    demo: 'https://mediart.jesusaraujo.lat',
    repo: 'https://github.com/JesusAraujoDEV/mediart',
  },
  // ? Sus commits son de sep–nov 2024. El README cita MySQL, pero el
  //   package.json también trae mongoose; el backend/admin lo hicieron sus compañeros.
  {
    title: 'Drinkers',
    role: { es: 'Frontend · E-commerce', en: 'Frontend · E-commerce' },
    year: '2024',
    blurb: {
      es: 'Sistema web de venta de licores: tienda online y panel de inventario, pedidos y reportes.',
      en: 'Liquor sales web system: online store plus an inventory, orders and reports admin panel.',
    },
    contribution: {
      es: 'Diseñé e implementé el frontend de la tienda, con foco en presentar el catálogo de forma clara.',
      en: 'I designed and built the store frontend, focused on presenting the catalogue clearly.',
    },
    highlights: [
      {
        es: 'Construí el frontend de la tienda: home, catálogo, ficha de producto y productos relacionados.',
        en: 'I built the store frontend: home, catalogue, product page and related products.',
      },
      {
        es: 'Desarrollé el carrito lateral y un checkout por pasos hasta subir el comprobante de pago.',
        en: 'I built the side cart and a step-by-step checkout ending with the payment receipt upload.',
      },
      {
        es: 'Creé las páginas de FAQ, Sobre nosotros, Términos, Privacidad y Devoluciones.',
        en: 'I created the FAQ, About us, Terms, Privacy and Returns pages.',
      },
      {
        es: 'Añadí header animado, menú lateral y acceso directo a WhatsApp para contactar a la tienda.',
        en: 'I added an animated header, side menu and a WhatsApp shortcut to contact the store.',
      },
    ],
    stack: ['JavaScript', 'Vite', 'CSS', 'EJS', 'Express', 'MySQL'],
    icon: '/icons/drinkers.png',
    accent: '#8bb8ff',
    repo: 'https://github.com/alejandrochmejia/drinkers',
  },
  {
    title: 'Pago Móvil Manager',
    role: same('Full-Stack'),
    year: '2026',
    blurb: {
      es: 'Gestor de pagos móviles para PyMEs venezolanas: registro con OCR, roles y estadísticas.',
      en: 'Mobile payments manager for Venezuelan SMEs: OCR capture, roles and analytics.',
    },
    contribution: {
      es: 'Desarrollé la aplicación completa para registrar y organizar pagos móviles en un solo lugar.',
      en: 'I built the full application to record and organise mobile payments in one place.',
    },
    highlights: [
      {
        es: 'Implementé el escaneo de comprobantes con Gemini para registrar pagos sin tipearlos.',
        en: 'I built receipt scanning with Gemini so payments are recorded without typing them.',
      },
      {
        es: 'Construí el modelo multi-empresa con cinco roles y audit log para equipos de trabajo.',
        en: 'I built the multi-company model with five roles and an audit log for teams.',
      },
      {
        es: 'Integré la tasa BCV del día para convertir Bs/USD y detecté pagos duplicados.',
        en: "I integrated the day's BCV rate for Bs/USD conversion and flagged duplicate payments.",
      },
      {
        es: 'Armé dashboards de KPIs financieros, por banco y de riesgo, con exportación a CSV, PDF y JSON.',
        en: 'I built financial, per-bank and risk KPI dashboards, with CSV, PDF and JSON export.',
      },
      {
        es: 'Empaqueté la app para Android con Capacitor y un workflow que genera el APK automáticamente.',
        en: 'I packaged the app for Android with Capacitor and a workflow that builds the APK automatically.',
      },
    ],
    stack: ['React', 'TypeScript', 'FastAPI', 'Python', 'Supabase', 'Google Gemini', 'Capacitor'],
    icon: '/icons/pagomovil.png',
    accent: '#5fd3c6',
    repo: 'https://github.com/alejandrochmejia/pagomovil-manager',
  },
  // ? Sus 22 commits (jun–jul 2024) se centran en el módulo de Mantenimiento
  //   (reportes). El rol "Full-Stack" es generoso: casi todo es vistas + inicio de controladores.
  {
    title: 'Restaurant System',
    role: same('Full-Stack'),
    year: '2024',
    blurb: {
      es: 'Sistema de gestión para el restaurante Bistrot: inventario, RRHH, compras, cocina, ventas y más.',
      en: 'Management system for the Bistrot restaurant: inventory, HR, purchasing, kitchen, sales and more.',
    },
    contribution: {
      es: 'Participé en el desarrollo del sistema construyendo el módulo de Mantenimiento y su gestión de reportes.',
      en: 'I took part in building the system, developing the Maintenance module and its reports management.',
    },
    highlights: [
      {
        es: 'Construí las vistas del módulo de Mantenimiento: página principal, contacto y barra lateral.',
        en: 'I built the Maintenance module views: main page, contact page and sidebar.',
      },
      {
        es: 'Desarrollé la sección de reportes: tabla, vista de detalle, redacción y eliminación.',
        en: 'I built the reports section: table, detail view, drafting and deletion.',
      },
      {
        es: 'Migré las maquetas HTML/CSS a plantillas EJS dentro de la estructura del proyecto.',
        en: "I migrated the HTML/CSS mockups to EJS templates within the project's structure.",
      },
      {
        es: 'Conecté las vistas con la API mediante fetch y arranqué los controladores en Express.',
        en: 'I connected the views to the API with fetch and started the Express controllers.',
      },
    ],
    stack: ['Node.js', 'Express', 'EJS', 'MySQL', 'JavaScript'],
    icon: '/icons/bistrot.png',
    accent: '#f6c56b',
    repo: 'https://github.com/angelopol/bistrot',
  },
  // Rol confirmado por Alejandro: analista programador (requisitos, modelado/diseño,
  // pruebas y documentación), 2024. El repo/demo enlazados son del sistema del equipo.
  {
    title: 'Charlotte Bistró',
    role: { es: 'Analista Programador', en: 'Programmer Analyst' },
    year: '2024',
    blurb: {
      es: 'Suite web de gestión para Charlotte Bistró: delivery, KPIs, atención al cliente, seguridad y cocina.',
      en: 'Management web suite for Charlotte Bistró: delivery, KPIs, customer service, security and kitchen.',
    },
    contribution: {
      es: 'Como analista programador, llevé el sistema del requisito al diseño: levantamiento, modelado, pruebas y documentación.',
      en: 'As programmer analyst, I took the system from requirements to design: elicitation, modelling, testing and documentation.',
    },
    highlights: [
      {
        es: 'Levanté los requisitos con el negocio y los convertí en casos de uso e historias de usuario.',
        en: 'I gathered requirements with the business and turned them into use cases and user stories.',
      },
      {
        es: 'Modelé el sistema con diagramas UML y el modelo entidad-relación de la base de datos.',
        en: 'I modelled the system with UML diagrams and the database entity-relationship model.',
      },
      {
        es: 'Diseñé casos de prueba y validé cada entrega contra los requisitos acordados.',
        en: 'I designed test cases and validated each delivery against the agreed requirements.',
      },
      {
        es: 'Documenté el sistema: especificación de requisitos y documentación técnica para el equipo.',
        en: 'I documented the system: requirements specification and technical docs for the team.',
      },
    ],
    stack: ['UML', 'Modelo ER', 'Casos de uso', 'Casos de prueba'],
    icon: '/icons/charlotte.png',
    accent: '#c9a2ff',
    demo: 'https://interfaces-control.vercel.app',
    repo: 'https://github.com/JesusAraujoDEV/interfaces-control',
  },
]
