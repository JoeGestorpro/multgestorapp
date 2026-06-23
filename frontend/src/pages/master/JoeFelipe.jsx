import { useState } from 'react'
import MasterLayout from '../../components/master/MasterLayout'
import PageHeader from '../../components/master/PageHeader'
import SectionCard from '../../components/master/SectionCard'
import StatusBadge from '../../components/master/StatusBadge'
import ActionButton from '../../components/master/ActionButton'
import MockNotice from '../../components/master/MockNotice'

const STAGES_INFO = [
  { stage: 'V1', label: 'Painel Read-only', status: 'done', description: 'Painel HTML local exibe estado do agente via API /api/state.' },
  { stage: 'V2', label: 'LLM Core (Mock)', status: 'done', description: 'MockProvider implementado — permite testar fluxo de perguntas com respostas simuladas.' },
  { stage: 'V3', label: 'Mission Builder (CLI)', status: 'progress', description: 'Classificação de risco + CLI de missões. Iniciado, não integrado ao frontend.' },
  { stage: 'V4', label: 'Governança Autônoma', status: 'future', description: 'Agente propõe ações corretivas baseadas em riscos e métricas.' },
  { stage: 'V5', label: 'Copiloto Integrado', status: 'future', description: 'Assistente contextual em todas as telas do master panel.' },
  { stage: 'V6', label: 'Geração de Relatórios', status: 'future', description: 'Agente gera relatórios executivos sob demanda.' },
  { stage: 'V7', label: 'Automação Total', status: 'future', description: 'Agente executa ações automaticamente com supervisão humana.' },
]

const STAGE_STATUS_MAP = { done: 'success', progress: 'warning', future: 'gray' }
const STAGE_STATUS_LABEL = { done: 'Implementado', progress: 'Em andamento', future: 'Futuro' }

const MOCK_RESPONSES = [
  { prompt: 'Resuma as últimas atividades do sistema', response: '📊 **Resumo das últimas 24h:**\n- 12 novas empresas cadastradas\n- 7 assinaturas ativadas\n- R$ 4.280 em MRR\n- 3 alertas críticos detectados\n- Backend saudável (uptime 99.8%)' },
  { prompt: 'Quais riscos estão críticos hoje?', response: '🔴 **Riscos Críticos Ativos:**\n1. CRITICAL-1: CORS aberto\n2. RK-01: God class barber.service.js\n3. RK-02: Barber.jsx monolítico\n4. RK-03: Sem camada de repositório\n\n⚠️ Recomendo priorizar CRITICAL-1 esta semana.' },
  { prompt: 'Sugira melhorias para o Dashboard', response: '💡 **Sugestões:**\n1. Adicionar gráfico de tendência de MRR\n2. Mostrar leads quentes do CRM\n3. Alertas de trial expirando\n4. Health score consolidado\n\nQuer que eu detalhe alguma?' },
]

export default function JoeFelipe() {
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)

  function handleSend(e) {
    e.preventDefault()
    if (!prompt.trim()) return

    const userMsg = { role: 'user', text: prompt }
    setChat(prev => [...prev, userMsg])
    setLoading(true)

    setTimeout(() => {
      const found = MOCK_RESPONSES.find(r => r.prompt.toLowerCase().includes(prompt.toLowerCase()))
      const reply = found?.response || `🤖 **JoeFelipe V2 (LLM Core Mock):**\n\nEntendi sua pergunta: "${prompt}"\n\nEsta é uma resposta mockada. No V3+, o agente utilizará o Mission Builder para classificar e responder com dados reais do sistema.\n\n*Funcionalidade preparada para backend futuro.*`
      const fixed = reply.replace('${prompt}', prompt)
      setChat(prev => [...prev, { role: 'assistant', text: fixed }])
      setLoading(false)
      setPrompt('')
    }, 1200)
  }

  return (
    <MasterLayout title="JoeFelipe IA">
      <PageHeader
        title="JoeFelipe"
        description="Copiloto inteligente da plataforma MultGestor."
      />

      <MockNotice />

      <div className="master-ia-layout">
        <div className="master-ia-main">
          <SectionCard title="Conversa">
            <div className="master-ia-chat">
              {chat.length === 0 && (
                <div className="master-ia-empty">
                  <strong>Bem-vindo ao JoeFelipe</strong>
                  <p>Faça uma pergunta sobre o sistema, riscos, métricas ou sugira melhorias.</p>
                  <div className="master-ia-suggestions">
                    {MOCK_RESPONSES.map((r, i) => (
                      <button key={i} className="master-btn master-btn--sm master-btn--ghost" type="button" onClick={() => { setPrompt(r.prompt); setTimeout(() => document.querySelector('.master-ia-input')?.focus(), 0) }}>
                        {r.prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chat.map((msg, i) => (
                <div key={i} className={`master-ia-message master-ia-message--${msg.role}`}>
                  <div className="master-ia-message-avatar">
                    {msg.role === 'user' ? 'U' : 'J'}
                  </div>
                  <div className="master-ia-message-content">
                    <strong>{msg.role === 'user' ? 'Você' : 'JoeFelipe'}</strong>
                    <p style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="master-ia-message master-ia-message--assistant">
                  <div className="master-ia-message-avatar">J</div>
                  <div className="master-ia-message-content">
                    <strong>JoeFelipe</strong>
                    <p style={{ color: 'var(--master-muted)' }}>Pensando…</p>
                  </div>
                </div>
              )}
            </div>
            <form className="master-ia-input-area" onSubmit={handleSend}>
              <input className="master-ia-input" type="text" placeholder="Digite sua pergunta…" value={prompt} onChange={e => setPrompt(e.target.value)} disabled={loading} />
              <ActionButton type="submit" variant="primary" loading={loading}>Enviar</ActionButton>
            </form>
          </SectionCard>
        </div>

        <div className="master-ia-sidebar">
          <SectionCard title="Estágios">
            <div className="master-ia-stages">
              {STAGES_INFO.map(s => (
                <div key={s.stage} className={`master-ia-stage master-ia-stage--${s.status}`}>
                  <div className="master-ia-stage-top">
                    <StatusBadge status={STAGE_STATUS_MAP[s.status]} label={STAGE_STATUS_LABEL[s.status]} />
                    <strong>{s.stage}</strong>
                  </div>
                  <p>{s.label}</p>
                  <small>{s.description}</small>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </MasterLayout>
  )
}
