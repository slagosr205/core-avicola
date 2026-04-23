import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LotesListPage from './pages/lotes/LotesListPage'
import LoteDetailPage from './pages/lotes/LoteDetailPage'
import LoteFormPage from './pages/lotes/LoteFormPage'
import PesajesListPage from './pages/pesajes/PesajesListPage'
import PesajeFormPage from './pages/pesajes/PesajeFormPage'
import MortalidadListPage from './pages/mortalidad/MortalidadListPage'
import MortalidadFormPage from './pages/mortalidad/MortalidadFormPage'
import AlimentacionListPage from './pages/alimentacion/AlimentacionListPage'
import AlimentacionFormPage from './pages/alimentacion/AlimentacionFormPage'
import CostosListPage from './pages/costos/CostosListPage'
import CostoFormPage from './pages/costos/CostoFormPage'
import ProcesamientoListPage from './pages/procesamiento/ProcesamientoListPage'
import ProcesamientoFormPage from './pages/procesamiento/ProcesamientoFormPage'
import TercerizacionListPage from './pages/tercerizacion/TercerizacionListPage'
import TercerizacionFormPage from './pages/tercerizacion/TercerizacionFormPage'
import ReportesPage from './pages/reportes/ReportesPage'
import OdooPage from './pages/odoo/OdooPage'
import SettingsPage from './pages/settings/SettingsPage'
import AmbientePage from './pages/ambiente/AmbientePage'
import PresupuestoPesosPage from './pages/presupuestoPesos/PresupuestoPesosPage'
import InventarioPage from './pages/inventario/InventarioPage'
import EntradaInventarioPage from './pages/inventario/EntradaInventarioPage'
import NuevoInsumoPage from './pages/inventario/NuevoInsumoPage'
import EditarInsumoPage from './pages/inventario/EditarInsumoPage'
import KardexPage from './pages/inventario/KardexPage'
import TransferenciaPage from './pages/inventario/TransferenciaPage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="lotes" element={<LotesListPage />} />
          <Route path="lotes/nuevo" element={<LoteFormPage />} />
          <Route path="lotes/:id" element={<LoteDetailPage />} />
          <Route path="lotes/:id/editar" element={<LoteFormPage />} />
          <Route path="pesajes" element={<PesajesListPage />} />
          <Route path="pesajes/nuevo" element={<PesajeFormPage />} />
          <Route path="pesajes/:id/editar" element={<PesajeFormPage />} />
          <Route path="mortalidad" element={<MortalidadListPage />} />
          <Route path="mortalidad/nuevo" element={<MortalidadFormPage />} />
          <Route path="mortalidad/:id/editar" element={<MortalidadFormPage />} />
          <Route path="alimentacion" element={<AlimentacionListPage />} />
          <Route path="alimentacion/nuevo" element={<AlimentacionFormPage />} />
          <Route path="alimentacion/:id/editar" element={<AlimentacionFormPage />} />
          <Route path="costos" element={<CostosListPage />} />
          <Route path="costos/nuevo" element={<CostoFormPage />} />
          <Route path="costos/:id/editar" element={<CostoFormPage />} />
          <Route path="procesamiento" element={<ProcesamientoListPage />} />
          <Route path="procesamiento/nuevo" element={<ProcesamientoFormPage />} />
          <Route path="procesamiento/:id" element={<ProcesamientoFormPage />} />
          <Route path="tercerizacion" element={<TercerizacionListPage />} />
          <Route path="tercerizacion/nuevo" element={<TercerizacionFormPage />} />
          <Route path="tercerizacion/:id/editar" element={<TercerizacionFormPage />} />
          <Route path="ambiente" element={<AmbientePage />} />
          <Route path="presupuesto-pesos" element={<PresupuestoPesosPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="odoo" element={<OdooPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="inventario/nuevo-insumo" element={<NuevoInsumoPage />} />
          <Route path="inventario/:id/editar" element={<EditarInsumoPage />} />
          <Route path="inventario/kardex/:id" element={<KardexPage />} />
          <Route path="inventario/entrada" element={<EntradaInventarioPage />} />
          <Route path="inventario/transferencia" element={<TransferenciaPage />} />
        </Route>
      </Routes>
    </>
  )
}
