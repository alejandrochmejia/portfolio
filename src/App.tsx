import { lazy, Suspense } from 'react'
import { Loader } from './components/Loader.tsx'

const World = lazy(() =>
  import('./components/World.tsx').then((m) => ({ default: m.World })),
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <World />
    </Suspense>
  )
}
