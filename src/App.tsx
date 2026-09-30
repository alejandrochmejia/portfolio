import { lazy, Suspense } from 'react'
import { Loader } from './components/Loader.tsx'
import { Menu } from './components/Menu.tsx'
import { TechStack } from './components/TechStack.tsx'
import { Experience } from './components/Experience.tsx'
import { Contact } from './components/Contact.tsx'

const SiteBackdrop = lazy(() => import('./components/SiteBackdrop.tsx'))

const World = lazy(() =>
  import('./components/World.tsx').then((m) => ({ default: m.World })),
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Suspense fallback={null}>
        <SiteBackdrop />
      </Suspense>
      <World />
      <TechStack />
      <Experience />
      <Contact />
      <Menu />
    </Suspense>
  )
}
