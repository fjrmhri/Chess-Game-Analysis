import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { daftarRute } from './ruteAplikasi'

const router = createBrowserRouter(daftarRute)

const akar = document.getElementById('root')
if (!akar) throw new Error('Elemen #root tidak ditemukan')

createRoot(akar).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
