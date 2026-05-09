import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Activations from './pages/Activations'
import Clients from './pages/Clients'
import Clima from './pages/Clima'
import ConfirmEmail from './pages/ConfirmEmail'
import FirstAccess from './pages/FirstAccess'
import ForgotPassword from './pages/ForgotPassword'
import BookingArea from './pages/booking/BookingArea'
import BookingLogin from './pages/booking/BookingLogin'
import BookingProfile from './pages/booking/BookingProfile'
import BookingRegister from './pages/booking/BookingRegister'
import BookingSuccess from './pages/booking/BookingSuccess'
import BookingPage from './pages/barber/BookingPage'
import BarberDashboard from './pages/barber/BarberDashboard'
import BarberLogin from './pages/barber/BarberLogin'
import FinanceDashboard from './pages/master/FinanceDashboard'
import MasterLogin from './pages/master/MasterLogin'
import LandingPage from './pages/public/LandingPage'
import ModuleSelect from './pages/ModuleSelect'
import Modules from './pages/Modules'
import NoModules from './pages/NoModules'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Subscriptions from './pages/Subscriptions'
import Terra from './pages/Terra'
import BarberPrivateRoute from './routes/BarberPrivateRoute'
import BookingPrivateRoute from './routes/BookingPrivateRoute'
import MasterPrivateRoute from './routes/MasterPrivateRoute'
import ModuleRoute from './routes/ModuleRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/barber/login" replace />} />
      <Route path="/barber/login" element={<BarberLogin />} />
      <Route path="/master/login" element={<MasterLogin />} />
      <Route path="/master" element={<Navigate to="/master/dashboard" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/first-access" element={<FirstAccess />} />
      <Route path="/primeiro-acesso" element={<FirstAccess />} />
      <Route path="/set-password" element={<FirstAccess />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/agendar/:slug" element={<BookingPage />} />
      <Route path="/agendar/:slug/login" element={<BookingLogin />} />
      <Route path="/agendar/:slug/cadastro" element={<BookingRegister />} />
      <Route path="/agendar/:slug/confirmado" element={<BookingSuccess />} />
      <Route path="/confirmar-email" element={<ConfirmEmail />} />
      <Route
        path="/agendar/:slug/minha-conta"
        element={
          <BookingPrivateRoute>
            <BookingArea />
          </BookingPrivateRoute>
        }
      />
      <Route
        path="/agendar/:slug/perfil"
        element={
          <BookingPrivateRoute>
            <BookingProfile />
          </BookingPrivateRoute>
        }
      />
      <Route path="/cliente/agendamentos" element={<Navigate to="/barber/login" replace />} />
      <Route
        path="/master/dashboard"
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
        path="/barber/agenda"
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
        path="/barber/servicos"
        element={
          <BarberPrivateRoute>
            <BarberDashboard />
          </BarberPrivateRoute>
        }
      />
      <Route
        path="/barber/clientes"
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
  )
}

export default App
