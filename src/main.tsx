import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import './gaya/token.css'
import './gaya/dasar.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { ambilPenyimpanan, bacaTema, terapkanTema } from './pembantu/tema'
import { daftarRute } from './ruteAplikasi'

terapkanTema(document.documentElement, bacaTema(ambilPenyimpanan()))

const router = createBrowserRouter(daftarRute)

const akar = document.getElementById('root')
if (!akar) throw new Error('Elemen #root tidak ditemukan')

createRoot(akar).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
