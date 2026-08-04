import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute, RequireRole, RoleHomeRedirect } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RepresentanteDashboardPage } from './pages/RepresentanteDashboardPage'
import { HistoricoSolicitacoesPage } from './pages/HistoricoSolicitacoesPage'
import { SolicitacaoDetailPage } from './pages/SolicitacaoDetailPage'
import { AprovacoesPage } from './pages/AprovacoesPage'
import { RelatoriosPage } from './pages/RelatoriosPage'
import { ReportMedicoPage } from './pages/ReportMedicoPage'
import { ImportarPlanilhaPage } from './pages/ImportarPlanilhaPage'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RoleHomeRedirect />} />

              <Route element={<RequireRole roles={['representante']} />}>
                <Route path="/dashboard" element={<RepresentanteDashboardPage />} />
              </Route>

              <Route path="/solicitacoes" element={<HistoricoSolicitacoesPage />} />
              <Route path="/solicitacoes/:id" element={<SolicitacaoDetailPage />} />
              <Route path="/relatorios/report-medico" element={<ReportMedicoPage />} />

              <Route element={<RequireRole roles={['gerente_comercial', 'admin']} />}>
                <Route path="/aprovacoes" element={<AprovacoesPage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
              </Route>

              <Route element={<RequireRole roles={['admin']} />}>
                <Route path="/importar" element={<ImportarPlanilhaPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
