import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import AnalisisPage from './pages/AnalisisPage'
import ListasPage from './pages/ListasPage'
import RepitentesPage from './pages/RepitentesPage'
import ConfigPage from './pages/ConfigPage'
import MateriasPage from './pages/MateriasPage'
import ComparativaPage from './pages/ComparativaPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/analisis" element={<AnalisisPage />} />
        <Route path="/analisis/:id" element={<AnalisisPage />} />
        <Route path="/analisis/:id/listas" element={<ListasPage />} />
        <Route path="/analisis/:id/materias" element={<MateriasPage />} />
        <Route path="/comparativa" element={<ComparativaPage />} />
        <Route path="/repitentes" element={<RepitentesPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Route>
    </Routes>
  )
}
