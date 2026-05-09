import { useState } from 'react'
import { Calendar, DollarSign, Users, TrendingUp, Plus } from 'lucide-react'
import {
  Shell,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  StatCard,
  Badge,
  Input
} from '../components/design-system'
import '../styles/globals.css'
import '../components/design-system/tokens/index.css'

const DEMO_USER = {
  name: 'Felipe Santos',
  role: 'Administrador',
  avatar: null
}

export default function DesignSystemDemo() {
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <Shell
      sidebarProps={{
        activeItem: activeNav,
        onNavigate: setActiveNav,
        companyName: 'Barber King',
        planName: 'Premium',
        user: DEMO_USER
      }}
      topbarProps={{
        title: 'Dashboard',
        subtitle: 'Visão geral do seu negócio',
        user: DEMO_USER
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Bem-vindo de volta, Felipe
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              Aqui está o resumo do seu dia
            </p>
          </div>
          <Button variant="primary" icon={<Plus />}>
            Novo agendamento
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <StatCard
            label="Faturamento do dia"
            value="R$ 2.450"
            trend={12}
            trendLabel="vs ontem"
            icon={DollarSign}
            iconVariant="accent"
          />
          <StatCard
            label="Atendimentos"
            value="18"
            trend={8}
            icon={Calendar}
            iconVariant="success"
          />
          <StatCard
            label="Clientes únicos"
            value="15"
            trend={-3}
            icon={Users}
            iconVariant="info"
          />
          <StatCard
            label="Taxa de conversão"
            value="87%"
            trend={5}
            icon={TrendingUp}
            iconVariant="warning"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          <Card>
            <CardHeader>
              <CardTitle>Serviços mais demandados</CardTitle>
              <Badge variant="accent">Este mês</Badge>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { name: 'Corte degradê', value: 45, revenue: 'R$ 2.025' },
                  { name: 'Barba completa', value: 32, revenue: 'R$ 800' },
                  { name: 'Corte + Barba', value: 28, revenue: 'R$ 1.680' },
                  { name: 'Sobrancelha', value: 15, revenue: 'R$ 225' },
                ].map((service) => (
                  <div key={service.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{service.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <Badge variant="neutral">{service.value}x</Badge>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>{service.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agenda de hoje</CardTitle>
              <Badge variant="success" dot>12 agendamentos</Badge>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { time: '09:00', client: 'Carlos Silva', service: 'Corte + Barba', collaborator: 'João' },
                  { time: '10:30', client: 'Maria Costa', service: 'Degradê', collaborator: 'Maria' },
                  { time: '11:00', client: 'Pedro Santos', service: 'Barba', collaborator: 'João' },
                  { time: '14:00', client: 'Lucas Oliveira', service: 'Corte', collaborator: 'Pedro' },
                ].map((appointment, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'var(--accent-muted)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--accent-primary)'
                    }}>
                      {appointment.time}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{appointment.client}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {appointment.service} • {appointment.collaborator}
                      </div>
                    </div>
                    <Badge variant="neutral">{appointment.time}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teste de componentes</CardTitle>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Buttons</h4>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" iconOnly><Plus /></Button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Badges</h4>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="success" dot>With dot</Badge>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Inputs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '280px' }}>
                  <Input placeholder="Nome completo" label="Nome" />
                  <Input placeholder="email@exemplo.com" label="Email" type="email" />
                  <Input placeholder="0,00" label="Valor" suffix="R$" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Shell>
  )
}