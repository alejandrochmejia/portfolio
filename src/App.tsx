import { lazy, Suspense } from 'react'
import { Loader } from './components/Loader.tsx'
import { Menu } from './components/Menu.tsx'
import { TechStack } from './components/TechStack.tsx'

const World = lazy(() =>
  import('./components/World.tsx').then((m) => ({ default: m.World })),
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <World />
      <TechStack />
      <Menu />
    </Suspense>
  )
}
