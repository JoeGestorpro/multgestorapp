import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import BarberPrivateRoute from './routes/BarberPrivateRoute'
import BookingPrivateRoute from './routes/BookingPrivateRoute'
import MasterPrivateRoute from './routes/MasterPrivateRoute'
import ModuleRoute from './routes/ModuleRoute'

const Activations      = lazy(() => import('./pages/Activations'))
const ChoosePlan       = lazy(() => import('./pages/ChoosePlan'))
const Clients          = lazy(() => import('./pages/Clients'))
const Clima            = lazy(() => import('./pages/Clima'))
const ConfirmEmail     = lazy(() => import('./pages/ConfirmEmail'))
const FirstAccess      = lazy(() => import('./pages/FirstAccess'))
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'))
const BookingArea      = lazy(() => import('./pages/booking/BookingArea'))
const BookingLogin     = lazy(() => import('./pages/booking/BookingLogin'))
const BookingProfile   = lazy(() => import('./pages/booking/BookingProfile'))
const BookingRegister  = lazy(() => import('./pages/booking/BookingRegister'))
const BookingSuccess   = lazy(() => import('./pages/booking/BookingSuccess'))
const BookingPage      = lazy(() => import('./pages/barber/BookingPage'))
const BarberDashboard  = lazy(() => import('./pages/barber/BarberDashboard'))
const BarberLogin      = lazy(() => import('./pages/barber/BarberLogin'))
const MasterDashboard  = lazy(() => import('./pages/MasterDashboard'))
const FinanceDashboard = lazy(() => import('./pages/master/FinanceDashboard'))
const MasterLogin      = lazy(() => import('./pages/master/MasterLogin'))
const LandingPage      = lazy(() => import('./pages/public/LandingPage'))
const BarberLanding    = lazy(() => import('./pages/barbergestor/BarberLanding'))
const ModuleSelect     = lazy(() => import('./pages/ModuleSelect'))
const Modules          = lazy(() => import('./pages/Modules'))
const NoModules        = lazy(() => import('./pages/NoModules'))
const Register         = lazy(() => import('./pages/Register'))
const ResetPassword    = lazy(() => import('./pages/ResetPassword'))
const Settings         = lazy(() => import('./pages/Settings'))
const Subscriptions    = lazy(() => import('./pages/Subscriptions'))
const Terra            = lazy(() => import('./pages/Terra'))

const Crm           = lazy(() => import('./pages/master/Crm'))
const Niches        = lazy(() => import('./pages/master/Niches'))
const Support       = lazy(() => import('./pages/master/Support'))
const Governance    = lazy(() => import('./pages/master/Governance'))
const HealthStatus  = lazy(() => import('./pages/master/HealthStatus'))
const JoeFelipe     = lazy(() => import('./pages/master/JoeFelipe'))
const Integrations  = lazy(() => import('./pages/master/Integrations'))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/barbergestor" element={<BarberLanding />} />
      <Route path="/login" element={<Navigate to="/barber/login" replace />} />
      <Route path="/barber/login" element={<BarberLogin />} />
      <Route path="/master/login" element={<MasterLogin />} />
      <Route path="/master" element={<Navigate to="/master/dashboard" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/escolher-plano" element={<ChoosePlan />} />
      <Route path="/first-access" element={<FirstAccess />} />
      <Route path="/primeiro-acesso" element={<FirstAccess />} />
      <Route path="/set-password" element={<FirstAccess />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/agendar/:slug" element={
        <ErrorBoundary fallback={
          <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
            <h3>Nao foi possivel carregar o agendamento</h3>
            <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
          </div>
        }>
          <BookingPage />
        </ErrorBoundary>
      } />
      <Route path="/agendar/:slug/login" element={
        <ErrorBoundary fallback={
          <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
            <h3>Nao foi possivel carregar o agendamento</h3>
            <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
          </div>
        }>
          <BookingLogin />
        </ErrorBoundary>
      } />
      <Route path="/agendar/:slug/cadastro" element={
        <ErrorBoundary fallback={
          <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
            <h3>Nao foi possivel carregar o agendamento</h3>
            <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
          </div>
        }>
          <BookingRegister />
        </ErrorBoundary>
      } />
      <Route path="/agendar/:slug/confirmado" element={
        <ErrorBoundary fallback={
          <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
            <h3>Nao foi possivel carregar o agendamento</h3>
            <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
          </div>
        }>
          <BookingSuccess />
        </ErrorBoundary>
      } />
      <Route path="/confirmar-email" element={<ConfirmEmail />} />
      <Route
        path="/agendar/:slug/minha-conta"
        element={
          <ErrorBoundary fallback={
            <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
              <h3>Nao foi possivel carregar o agendamento</h3>
              <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
            </div>
          }>
            <BookingPrivateRoute>
              <BookingArea />
            </BookingPrivateRoute>
          </ErrorBoundary>
        }
      />
      <Route
        path="/agendar/:slug/perfil"
        element={
          <ErrorBoundary fallback={
            <div style={{ padding: '2rem', textAlign: 'center', color: '#1f2933' }}>
              <h3>Nao foi possivel carregar o agendamento</h3>
              <p style={{ color: '#667085' }}>Tente novamente ou entre em contato com a barbearia.</p>
            </div>
          }>
            <BookingPrivateRoute>
              <BookingProfile />
            </BookingPrivateRoute>
          </ErrorBoundary>
        }
      />
      <Route path="/cliente/agendamentos" element={<Navigate to="/barber/login" replace />} />
      <Route
        path="/master/dashboard"
        element={
          <MasterPrivateRoute>
            <MasterDashboard />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/financeiro"
        element={
          <MasterPrivateRoute>
            <FinanceDashboard />
          </MasterPrivateRoute>
        }
      />
      <Route
      path="/master/modules"
        element={
          <MasterPrivateRoute>
            <Modules />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/clients"
        element={
          <MasterPrivateRoute>
            <Clients />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/subscriptions"
        element={
          <MasterPrivateRoute>
            <Subscriptions />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/activations"
        element={
          <MasterPrivateRoute>
            <Activations />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/settings"
        element={
          <MasterPrivateRoute>
            <Settings />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/crm"
        element={
          <MasterPrivateRoute>
            <Crm />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/niches"
        element={
          <MasterPrivateRoute>
            <Niches />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/support"
        element={
          <MasterPrivateRoute>
            <Support />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/governance"
        element={
          <MasterPrivateRoute>
            <Governance />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/health"
        element={
          <MasterPrivateRoute>
            <HealthStatus />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/joe-felipe"
        element={
          <MasterPrivateRoute>
            <JoeFelipe />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/master/integrations"
        element={
          <MasterPrivateRoute>
            <Integrations />
          </MasterPrivateRoute>
        }
      />
      <Route
        path="/select-module"
        element={
          <BarberPrivateRoute>
            <ModuleSelect />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/no-modules"
        element={
          <BarberPrivateRoute>
            <NoModules />
          </BarberPrivateRoute>
        }
      />
      <Route path="/barber" element={<Navigate to="/barber/dashboard" replace />} />
      <Route
        path="/barber/dashboard"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/agendamentos"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/agenda/*"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/minha-agenda"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/servicos/*"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/clientes/*"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/produtos"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/vendas"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/caixa"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/acertos"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/colaboradores"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/relatorios"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/configuracoes"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/*"
        element={
          <Navigate to="/barber/dashboard" replace />
        }
      />
      <Route
        path="/clima"
        element={
          <ModuleRoute slug="clima">
            <Clima />
          </ModuleRoute>
        }
      />
      <Route
        path="/terra"
        element={
          <ModuleRoute slug="terra">
            <Terra />
          </ModuleRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/master/dashboard" replace />} />
      <Route path="/modules" element={<Navigate to="/master/modules" replace />} />
      <Route path="/clients" element={<Navigate to="/master/clients" replace />} />
      <Route path="/subscriptions" element={<Navigate to="/master/subscriptions" replace />} />
      <Route path="/activations" element={<Navigate to="/master/activations" replace />} />
      <Route path="/settings" element={<Navigate to="/master/settings" replace />} />
      <Route path="*" element={<Navigate to="/barber/login" replace />} />
    </Routes>
    </Suspense>
  )
}

export default App
