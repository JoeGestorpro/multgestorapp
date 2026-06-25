import './BarberOverviewPage.css'
import { useBarberOverview } from './hooks/useBarberOverview'
import OverviewHero from './components/OverviewHero'
import NextAppointmentCard from './components/NextAppointmentCard'
import TodayAgendaCard from './components/TodayAgendaCard'
import SmartAlertsPanel from './components/SmartAlertsPanel'
import KPIGrid from './components/KPIGrid'
import DailyGoalCard from './components/DailyGoalCard'
import TeamPerformanceCard from './components/TeamPerformanceCard'
import TopServicesCard from './components/TopServicesCard'
import RecoveryClientsCard from './components/RecoveryClientsCard'
import ExtraSalesCard from './components/ExtraSalesCard'
import PaymentsSummaryCard from './components/PaymentsSummaryCard'
import RevenueChartCard from './components/RevenueChartCard'

export default function BarberOverviewPage({ user, onNewSale }) {
  const {
    loading,
    nextAppointment,
    agenda,
    alerts,
    kpis,
    dailyGoal,
    teamPerformance,
    topServices,
    recoveryClients,
    products,
    payments,
    revenueChart
  } = useBarberOverview()

  return (
    <div className="barber-overview">
      {/* 1 — Greeting + Quick Actions */}
      <OverviewHero user={user} onNewSale={onNewSale} />

      {/* 2 — Próximo Atendimento */}
      <NextAppointmentCard appointment={nextAppointment} loading={loading} />

      {/* 3 — Agenda de Hoje */}
      <TodayAgendaCard agenda={agenda} loading={loading} />

      {/* 4 — Alertas Inteligentes */}
      <SmartAlertsPanel alerts={alerts} loading={loading} />

      {/* 5 — KPIs Principais */}
      <KPIGrid kpis={kpis} loading={loading} />

      {/* 6 — Meta do Dia + Performance da Equipe */}
      <div className="overview-grid-3">
        <DailyGoalCard dailyGoal={dailyGoal} loading={loading} />
        <TeamPerformanceCard teamPerformance={teamPerformance} loading={loading} />
      </div>

      {/* 7 — Clientes para Recuperação + Top Serviços */}
      <div className="overview-grid-2">
        <RecoveryClientsCard recoveryClients={recoveryClients} loading={loading} />
        <TopServicesCard topServices={topServices} loading={loading} />
      </div>

      {/* 8 — Produtos e Geladeira + Recebimentos */}
      <div className="overview-grid-2">
        <ExtraSalesCard products={products} loading={loading} />
        <PaymentsSummaryCard payments={payments} loading={loading} />
      </div>

      {/* 9 — Tendência de Faturamento */}
      <RevenueChartCard revenueChart={revenueChart} loading={loading} />
    </div>
  )
}
