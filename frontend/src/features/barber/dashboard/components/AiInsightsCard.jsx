import { useCallback, useEffect, useState } from 'react'
import { Sparkles, TrendingUp, UserX, RefreshCw, X, AlertCircle } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Button from '../../../../components/design-system/ui/Button'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import api from '../../../../services/api'

const TYPE_ICON = {
  demand_prediction: TrendingUp,
  churn_alert: UserX
}

const TYPE_LABEL = {
  demand_prediction: 'Previsão de demanda',
  churn_alert: 'Alerta de churn'
}

export default function AiInsightsCard() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [dismissingId, setDismissingId] = useState(null)

  const loadInsights = useCallback(async () => {
    setLoading(true)
    setUnavailable(false)
    try {
      const response = await api.get('/barber/ai/insights')
      setSuggestions(response.data?.data?.suggestions || [])
    } catch {
      setUnavailable(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  async function handleRefresh() {
    setRefreshing(true)
    setUnavailable(false)
    try {
      const response = await api.get('/barber/ai/insights/refresh')
      setSuggestions(response.data?.data?.suggestions || [])
    } catch {
      setUnavailable(true)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDismiss(id) {
    setDismissingId(id)
    try {
      await api.post(`/barber/ai/insights/${id}/dismiss`)
      setSuggestions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // Falha ao dispensar: mantém o card na lista, usuário pode tentar de novo.
    } finally {
      setDismissingId(null)
    }
  }

  if (loading) {
    return (
      <Card className="ai-insights-card ai-insights-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  return (
    <Card className="ai-insights-card">
      <CardHeader>
        <div className="ai-insights__header">
          <div>
            <CardTitle>
              <Sparkles size={16} className="ai-insights__title-icon" />
              Insights IA
            </CardTitle>
            <CardSubtitle>Previsão de demanda e clientes em risco</CardSubtitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing} disabled={refreshing}>
            <RefreshCw size={14} />
            <span>Atualizar</span>
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {unavailable ? (
          <Empty icon={<AlertCircle size={32} />} title="Indisponível" description="Não foi possível carregar os insights de IA agora. Tente atualizar em instantes." compact />
        ) : suggestions.length > 0 ? (
          <div className="ai-insights__list">
            {suggestions.map((s) => {
              const Icon = TYPE_ICON[s.type] || Sparkles
              return (
                <div className="ai-insights__item" key={s.id}>
                  <div className="ai-insights__item-icon">
                    <Icon size={18} />
                  </div>
                  <div className="ai-insights__item-content">
                    <div className="ai-insights__item-title-row">
                      <span className="ai-insights__item-title">{s.title}</span>
                      <Badge variant={s.source === 'llm' ? 'accent' : 'neutral'}>
                        {s.source === 'llm' ? 'IA' : TYPE_LABEL[s.type] || 'Regra'}
                      </Badge>
                    </div>
                    <p className="ai-insights__item-desc">{s.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => handleDismiss(s.id)}
                    disabled={dismissingId === s.id}
                    aria-label="Dispensar insight"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty title="Sem insights por enquanto" description="Assim que houver agendamentos suficientes, previsões e alertas aparecerão aqui." compact />
        )}
      </CardBody>
    </Card>
  )
}
