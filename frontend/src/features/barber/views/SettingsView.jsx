import { Card, Badge, Button } from '../../../components/design-system'
import { BarberBadge, BarberCard } from '../../../components/barber/BarberUI'
import BookingLandingConfig from '../../../pages/booking/BookingLandingConfig'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Settings,
  Palette,
  Calendar,
  Check,
  X,
  RefreshCw,
  Save,
  Image,
  Upload,
  Trash2,
  MessageSquare,
  Send
} from 'lucide-react'

export default function SettingsView({
  isAdmin,
  settingsData,
  settingsSection,
  settingsLoading,
  brandingForm,
  brandingLoading,
  brandingLogoPreview,
  logoPreview,
  user,
  fullDate,
  emptyBarberSettings,
  setSettingsSection,
  loadBranding,
  handleBackToMenu,
  handleBrandingSubmit,
  handleBrandingFieldChange,
  handleBrandingLogoSelect,
  handleBrandingLogoRemove,
  brandingSaving,
  handleCompanyProfileSubmit,
  handleCompanyFieldChange,
  companyProfileSaving,
  handleAgendaSettingsSubmit,
  handleAgendaSettingsChange,
  settingsSaving,
  pinRecoveryOpen,
  pinRecoveryStep,
  pinRecoveryForm,
  pinRecoverySubmitting,
  handlePinRecoveryRequest,
  handlePinResetSubmit,
  handlePinRecoveryFieldChange,
  resetPinRecoveryFlow,
  openPinRecovery,
  integrationConfig,
  integrationLoading,
  integrationSaving,
  integrationForm,
  integrationTestPhone,
  integrationTestResult,
  integrationTestSending,
  handleIntegrationFormChange,
  handleIntegrationSubmit,
  handleIntegrationDelete,
  handleIntegrationTest,
  setIntegrationTestPhone
}) {
  if (!isAdmin) {
    return (
      <BarberCard>
        <div className="barber-panel-header">
          <div>
            <span className="barber-overline">Configuracoes</span>
            <h3>Acesso restrito</h3>
            <p>Apenas o dono/admin pode gerenciar PIN e dados sensiveis da empresa.</p>
          </div>
          <BarberBadge tone="danger">Restrito</BarberBadge>
        </div>
      </BarberCard>
    )
  }

  const company = settingsData.company || emptyBarberSettings.company
  const publicBookingSlug = company.public_booking_slug || ''
  const publicBookingUrl = publicBookingSlug ? `${window.location.origin}/agendar/${publicBookingSlug}` : ''
  const onlineMinAdvanceEnabled = settingsData.agenda?.online_min_advance_enabled === true
  const onlineMinAdvanceValue = Number(settingsData.agenda?.online_min_advance_value || 0)
  const _currentLogo = logoPreview || company.logo_url || ''
  const bf = brandingForm
  const brandingLogo = brandingLogoPreview || bf.logo_url || ''

  if (settingsSection === 'branding') {
    return (
      <>
        <div className="barber-settings-back-row">
          <button className="barber-settings-back-btn" onClick={handleBackToMenu}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <span className="barber-overline">Identidade visual da empresa</span>
        </div>
        {brandingLoading ? (
          <Card padding="md">
            <p>Carregando dados de identidade visual...</p>
          </Card>
        ) : (
          <section className="barber-grid-two barber-settings-grid">
            <Card className="barber-settings-card" padding="md">
              <div className="barber-panel-header">
                <div>
                  <span className="barber-overline">Identidade visual</span>
                  <h3>Logo e cores da marca</h3>
                  <p>Defina a identidade visual da empresa exibida no sistema e na agenda online.</p>
                </div>
              </div>

              <form className="barber-form-grid" onSubmit={handleBrandingSubmit}>
                <label className="barber-settings-field">
                  <span>Nome da empresa</span>
                  <input
                    value={bf.name || ''}
                    onChange={(e) => handleBrandingFieldChange('name', e.target.value)}
                    placeholder="Nome da sua empresa"
                  />
                </label>
                <label className="barber-settings-field">
                  <span>Nome de exibicao</span>
                  <input
                    value={bf.display_name || ''}
                    onChange={(e) => handleBrandingFieldChange('display_name', e.target.value)}
                    placeholder="Nome na agenda online"
                  />
                </label>

                <div className="barber-settings-logo-section">
                  <div className="barber-settings-logo-preview-area">
                    {brandingLogo ? (
                      <img
                        className="barber-settings-logo-img"
                        src={brandingLogo}
                        alt="Logo da empresa"
                      />
                    ) : (
                      <div className="barber-settings-logo-placeholder">
                        <Image />
                      </div>
                    )}
                  </div>
                  <div className="barber-settings-logo-actions">
                    <label className="barber-settings-logo-upload-btn">
                      <Upload />
                      <span>Selecionar imagem</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="barber-settings-logo-input"
                        onChange={handleBrandingLogoSelect}
                      />
                    </label>
                    {brandingLogo ? (
                      <button
                        type="button"
                        className="barber-settings-logo-remove-btn"
                        onClick={handleBrandingLogoRemove}
                      >
                        <Trash2 />
                        <span>Remover logo</span>
                      </button>
                    ) : null}
                    <p className="barber-settings-logo-hint">JPEG, PNG ou WebP. Maximo 2 MB.</p>
                  </div>
                </div>

                <div className="barber-input-grid barber-settings-colors">
                  <label className="barber-settings-field">
                    <span>Cor principal</span>
                    <div className="barber-settings-color-row">
                      <input
                        type="color"
                        value={bf.primary_color || '#a3ff12'}
                        onChange={(e) => handleBrandingFieldChange('primary_color', e.target.value)}
                      />
                      <input
                        value={bf.primary_color || ''}
                        onChange={(e) => handleBrandingFieldChange('primary_color', e.target.value)}
                        placeholder="#a3ff12"
                      />
                    </div>
                  </label>
                  <label className="barber-settings-field">
                    <span>Cor secundaria</span>
                    <div className="barber-settings-color-row">
                      <input
                        type="color"
                        value={bf.secondary_color || '#0c1017'}
                        onChange={(e) => handleBrandingFieldChange('secondary_color', e.target.value)}
                      />
                      <input
                        value={bf.secondary_color || ''}
                        onChange={(e) => handleBrandingFieldChange('secondary_color', e.target.value)}
                        placeholder="#0c1017"
                      />
                    </div>
                  </label>
                  <label className="barber-settings-field">
                    <span>Cor de destaque</span>
                    <div className="barber-settings-color-row">
                      <input
                        type="color"
                        value={bf.accent_color || '#7fe11e'}
                        onChange={(e) => handleBrandingFieldChange('accent_color', e.target.value)}
                      />
                      <input
                        value={bf.accent_color || ''}
                        onChange={(e) => handleBrandingFieldChange('accent_color', e.target.value)}
                        placeholder="#7fe11e"
                      />
                    </div>
                  </label>
                </div>

                <div className="barber-settings-actions">
                  <Button disabled={brandingSaving} type="submit" variant="primary">
                    <Save />
                    <span>{brandingSaving ? 'Salvando...' : 'Salvar identidade visual'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </section>
        )}
      </>
    )
  }

  if (settingsSection === 'booking-landing') {
    return (
      <>
        <div className="barber-settings-back-row">
          <button className="barber-settings-back-btn" onClick={handleBackToMenu}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <span className="barber-overline">Configuracoes da agenda online</span>
        </div>
        <BookingLandingConfig />
      </>
    )
  }

  if (settingsSection === 'integrations') {
    const isConfigured = integrationConfig && integrationConfig.configured !== false
    const isEnabled = isConfigured && integrationConfig.integrationEnabled === true
    const tokenConfigured = isConfigured && integrationConfig.tokenConfigured === true

    let badgeTone = 'danger'
    let badgeLabel = 'Nao configurado'
    if (isConfigured) {
      badgeTone = isEnabled ? 'success' : 'neutral'
      badgeLabel = isEnabled ? 'Ativo' : 'Inativo'
    }

    return (
      <>
        <div className="barber-settings-back-row">
          <button className="barber-settings-back-btn" onClick={handleBackToMenu}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <span className="barber-overline">Integracao com WhatsApp</span>
        </div>
        {integrationLoading ? (
          <Card padding="md">
            <p>Carregando configuracao de integracao...</p>
          </Card>
        ) : (
          <section className="barber-grid-two barber-settings-grid">
            <Card className="barber-settings-card" padding="md">
              <div className="barber-panel-header">
                <div>
                  <span className="barber-overline">WhatsApp Business</span>
                  <h3>Configuracao da API</h3>
                  <p>Conecte sua conta do WhatsApp Business API para enviar notificacoes automaticas de agendamento, lembretes e confirmacoes.</p>
                </div>
                <BarberBadge tone={badgeTone}>{badgeLabel}</BarberBadge>
              </div>

              <form className="barber-form-grid" onSubmit={handleIntegrationSubmit}>
                <label className="barber-settings-field">
                  <span>Provedor</span>
                  <select
                    className="barber-select"
                    value={integrationForm.providerType}
                    onChange={(e) => handleIntegrationFormChange('providerType', e.target.value)}
                  >
                    <option value="meta_cloud_api">Meta Cloud API</option>
                    <option value="mock">Mock (teste)</option>
                  </select>
                </label>

                <label className="barber-settings-field">
                  <span>Phone Number ID</span>
                  <input
                    value={integrationForm.phoneNumberId || ''}
                    onChange={(e) => handleIntegrationFormChange('phoneNumberId', e.target.value)}
                    placeholder="ID do numero de telefone no Meta Business"
                  />
                </label>

                <label className="barber-settings-field">
                  <span>Token de acesso</span>
                  <input
                    type="password"
                    value={integrationForm.accessToken || ''}
                    onChange={(e) => handleIntegrationFormChange('accessToken', e.target.value)}
                    placeholder={tokenConfigured ? '•••••••• (token configurado)' : 'Token de acesso permanente do Meta'}
                  />
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>
                    {tokenConfigured ? 'Deixe em branco para manter o token atual.' : ''}
                  </p>
                </label>

                <label className="barber-settings-field">
                  <span>Business Account ID</span>
                  <input
                    value={integrationForm.businessAccountId || ''}
                    onChange={(e) => handleIntegrationFormChange('businessAccountId', e.target.value)}
                    placeholder="ID da conta business (opcional)"
                  />
                </label>

                <label className="barber-settings-field">
                  <span>URL da API</span>
                  <input
                    value={integrationForm.apiUrl || ''}
                    onChange={(e) => handleIntegrationFormChange('apiUrl', e.target.value)}
                    placeholder="https://graph.facebook.com/v18.0 (opcional)"
                  />
                </label>

                <label className="barber-settings-toggle">
                  <span>Integracao ativa</span>
                  <input
                    checked={integrationForm.integrationEnabled}
                    onChange={(e) => handleIntegrationFormChange('integrationEnabled', e.target.checked)}
                    type="checkbox"
                  />
                </label>

                <div className="barber-settings-actions">
                  <Button disabled={integrationSaving} type="submit" variant="primary">
                    <Save />
                    <span>{integrationSaving ? 'Salvando...' : 'Salvar configuracao'}</span>
                  </Button>
                  {isConfigured ? (
                    <Button onClick={handleIntegrationDelete} type="button" variant="ghost">
                      <Trash2 />
                      <span>Remover integracao</span>
                    </Button>
                  ) : null}
                </div>
              </form>
            </Card>

            {isEnabled ? (
              <Card className="barber-settings-card" padding="md">
                <div className="barber-panel-header">
                  <div>
                    <span className="barber-overline">Teste</span>
                    <h3>Testar integracao</h3>
                    <p>Envie uma mensagem de teste para validar a conexao com a API do WhatsApp.</p>
                  </div>
                </div>

                <form className="barber-form-grid" onSubmit={(e) => { e.preventDefault(); handleIntegrationTest() }}>
                  <label className="barber-settings-field">
                    <span>Numero de telefone</span>
                    <input
                      value={integrationTestPhone}
                      onChange={(e) => setIntegrationTestPhone(e.target.value)}
                      placeholder="5511999999999"
                    />
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>
                      Formato internacional sem o sinal de +. Ex: 5511999999999
                    </p>
                  </label>

                  <div className="barber-settings-actions">
                    <Button disabled={integrationTestSending} type="submit" variant="primary">
                      <Send />
                      <span>{integrationTestSending ? 'Enviando...' : 'Enviar mensagem de teste'}</span>
                    </Button>
                  </div>
                </form>

                {integrationTestResult ? (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    padding: 16,
                    marginTop: 16,
                    borderRadius: 8,
                    background: integrationTestResult.success ? 'var(--success-bg, #e8f5e9)' : 'var(--danger-bg, #ffebee)',
                    border: `1px solid ${integrationTestResult.success ? 'var(--success, #4caf50)' : 'var(--danger, #ef5350)'}`
                  }}>
                    {integrationTestResult.success ? <Check size={20} style={{ flexShrink: 0, marginTop: 2 }} /> : <X size={20} style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div>
                      <strong>{integrationTestResult.success ? 'Mensagem enviada com sucesso' : 'Falha no envio'}</strong>
                      <p style={{ margin: '4px 0 0' }}>
                        {integrationTestResult.success ? `ID: ${integrationTestResult.messageId}` : (integrationTestResult.error || 'Erro desconhecido')}
                      </p>
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}
          </section>
        )}
      </>
    )
  }

  if (settingsSection === 'general') {
    return (
      <>
        <div className="barber-settings-back-row">
          <button className="barber-settings-back-btn" onClick={handleBackToMenu}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <span className="barber-overline">Configuracoes gerais</span>
        </div>
        <section className="barber-grid-two barber-settings-grid">

          <Card className="barber-settings-card" padding="md">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Empresa</span>
                <h3>Dados da empresa</h3>
                <p>Informacoes principais exibidas no sistema administrativo e na agenda online.</p>
              </div>
            </div>

            <form className="barber-form-grid" onSubmit={handleCompanyProfileSubmit}>
              <label className="barber-settings-field">
                <span>Nome da empresa</span>
                <input
                  value={company.name || ''}
                  onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                  placeholder="Nome da sua empresa"
                />
              </label>
              <label className="barber-settings-field">
                <span>Nome de exibicao</span>
                <input
                  value={company.public_display_name || ''}
                  onChange={(e) => handleCompanyFieldChange('public_display_name', e.target.value)}
                  placeholder="Nome na agenda online"
                />
              </label>

              <label className="barber-settings-field">
                <span>E-mail comercial</span>
                <input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => handleCompanyFieldChange('email', e.target.value)}
                  placeholder="contato@empresa.com.br"
                />
              </label>
              <label className="barber-settings-field">
                <span>E-mail de contato</span>
                <input
                  type="email"
                  value={company.business_email || ''}
                  onChange={(e) => handleCompanyFieldChange('business_email', e.target.value)}
                  placeholder="admin@empresa.com.br"
                />
              </label>

              <label className="barber-settings-field">
                <span>Telefone</span>
                <input
                  value={company.phone || ''}
                  onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                  placeholder="(65) 0000-0000"
                />
              </label>
              <label className="barber-settings-field">
                <span>WhatsApp</span>
                <input
                  value={company.whatsapp_phone || ''}
                  onChange={(e) => handleCompanyFieldChange('whatsapp_phone', e.target.value)}
                  placeholder="(65) 90000-0000"
                />
              </label>

              <label className="barber-settings-field" style={{ gridColumn: '1 / -1' }}>
                <span>Endereco</span>
                <input
                  value={company.address_line || ''}
                  onChange={(e) => handleCompanyFieldChange('address_line', e.target.value)}
                  placeholder="Rua, numero, bairro"
                />
              </label>

              <label className="barber-settings-field">
                <span>Cidade</span>
                <input
                  value={company.city || ''}
                  onChange={(e) => handleCompanyFieldChange('city', e.target.value)}
                  placeholder="Cidade"
                />
              </label>
              <label className="barber-settings-field">
                <span>Estado</span>
                <input
                  value={company.state || ''}
                  onChange={(e) => handleCompanyFieldChange('state', e.target.value)}
                  placeholder="MT"
                />
              </label>

              <label className="barber-settings-field" style={{ gridColumn: '1 / -1' }}>
                <span>Descricao da empresa</span>
                <textarea
                  rows={3}
                  value={company.business_description || ''}
                  onChange={(e) => handleCompanyFieldChange('business_description', e.target.value)}
                  placeholder="Uma descricao curta sobre sua empresa..."
                />
              </label>

              <div className="barber-settings-actions">
                <Button disabled={companyProfileSaving} type="submit" variant="primary">
                  <Save />
                  <span>{companyProfileSaving ? 'Salvando...' : 'Salvar dados'}</span>
                </Button>
              </div>
            </form>
          </Card>

          <Card className="barber-settings-card" padding="md">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Agenda</span>
                <h3>Antecedencia para agendamento online</h3>
                <p>Defina se o cliente precisa reservar com horas minimas de antecedencia no link publico.</p>
              </div>
              <Badge variant={onlineMinAdvanceEnabled ? 'success' : 'neutral'}>
                {onlineMinAdvanceEnabled ? 'Ativa' : 'Desativada'}
              </Badge>
            </div>

            <form className="barber-form-grid" onSubmit={handleAgendaSettingsSubmit}>
              <label className="barber-settings-toggle">
                <span>Exigir antecedencia minima para agendamentos online</span>
                <input
                  checked={onlineMinAdvanceEnabled}
                  onChange={(event) => handleAgendaSettingsChange('online_min_advance_enabled', event.target.checked)}
                  type="checkbox"
                />
              </label>

              {onlineMinAdvanceEnabled ? (
                <div className="barber-input-grid">
                  <label>
                    <span>Antecedencia minima</span>
                    <input
                      inputMode="numeric"
                      min="1"
                      onChange={(event) => handleAgendaSettingsChange('online_min_advance_value', Number(event.target.value || 0))}
                      placeholder="1, 2, 4, 8, 12 ou 24"
                      step="1"
                      type="number"
                      value={onlineMinAdvanceValue || ''}
                    />
                  </label>
                </div>
              ) : null}

              <div className="barber-settings-hint">
                <Clock />
                <span>
                  {onlineMinAdvanceEnabled
                    ? `Clientes so verao horarios com pelo menos ${onlineMinAdvanceValue || 1} horas de antecedencia.`
                    : 'Com a regra desativada, o cliente podera reservar qualquer horario disponivel no link online.'}
                </span>
              </div>

              <div className="barber-settings-actions">
                <Button disabled={settingsSaving} type="submit" variant="primary">
                  <Check />
                  <span>{settingsSaving ? 'Salvando...' : 'Salvar agenda'}</span>
                </Button>
              </div>
            </form>
          </Card>

          <Card className="barber-settings-card" padding="md">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Preferencias</span>
                <h3>Configuracoes operacionais</h3>
                <p>Moeda, fuso horario e preferencias de notificacao do sistema.</p>
              </div>
            </div>

            <div className="barber-settings-prefs">
              <div className="barber-settings-meta">
                <div className="barber-settings-meta-item">
                  <span>Moeda padrao</span>
                  <strong>BRL (R$)</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Fuso horario</span>
                  <strong>{settingsData.agenda?.timezone || 'America/Cuiaba'}</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Notificacoes por e-mail</span>
                  <strong>Em breve</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Notificacoes por WhatsApp</span>
                  <strong>Em breve</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Link publico da agenda</span>
                  <strong>{publicBookingUrl || 'Nao configurado'}</strong>
                </div>
              </div>
            </div>
          </Card>

          <Card className="barber-settings-card" padding="md">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Seguranca</span>
                <h3>Recuperacao e troca de PIN</h3>
                <p>Use este fluxo para redefinir o PIN do dono/admin sem expor dados sensiveis no painel.</p>
              </div>
              <Badge variant="admin">Prioridade</Badge>
            </div>

            <div className="barber-settings-security-callout">
              <div>
                <strong>PIN sensivel da operacao</strong>
                <p>O codigo enviado por e-mail expira em {settingsData.security?.expires_in_minutes || 10} minutos.</p>
              </div>
              <Button onClick={openPinRecovery} type="button" variant="primary">
                <RefreshCw />
                <span>Esqueci meu PIN</span>
              </Button>
            </div>

            {settingsLoading ? (
              <div className="barber-settings-loading">
                <p>Carregando configuracoes de agenda e seguranca...</p>
              </div>
            ) : null}

            {pinRecoveryOpen ? (
              <div className="barber-settings-security-flow">
                <div className="barber-settings-stepper">
                  <span className={pinRecoveryStep === 'request' ? 'active' : ''}>1. Validar e-mail</span>
                  <span className={pinRecoveryStep === 'reset' ? 'active' : ''}>2. Redefinir PIN</span>
                </div>

                {pinRecoveryStep === 'request' ? (
                  <form className="barber-form-grid" onSubmit={handlePinRecoveryRequest}>
                    <label>
                      <span>E-mail de recuperacao</span>
                      <input
                        onChange={(event) => handlePinRecoveryFieldChange('email', event.target.value)}
                        placeholder="dono@empresa.com.br"
                        type="email"
                        value={pinRecoveryForm.email}
                      />
                    </label>
                    <div className="barber-settings-actions">
                      <Button disabled={pinRecoverySubmitting} type="submit" variant="primary">
                        <Check />
                        <span>{pinRecoverySubmitting ? 'Enviando codigo...' : 'Enviar codigo'}</span>
                      </Button>
                      <Button onClick={() => resetPinRecoveryFlow(pinRecoveryForm.email)} type="button" variant="ghost">
                        <X />
                        <span>Fechar</span>
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form className="barber-form-grid" onSubmit={handlePinResetSubmit}>
                    <label>
                      <span>E-mail de recuperacao</span>
                      <input onChange={(event) => handlePinRecoveryFieldChange('email', event.target.value)} type="email" value={pinRecoveryForm.email} />
                    </label>
                    <div className="barber-input-grid">
                      <label>
                        <span>Codigo de 6 digitos</span>
                        <input
                          inputMode="numeric"
                          maxLength={6}
                          onChange={(event) => handlePinRecoveryFieldChange('code', event.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          value={pinRecoveryForm.code}
                        />
                      </label>
                      <label>
                        <span>Novo PIN</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => handlePinRecoveryFieldChange('newPin', event.target.value.replace(/\D/g, ''))}
                          placeholder="Minimo 4 digitos"
                          type="password"
                          value={pinRecoveryForm.newPin}
                        />
                      </label>
                      <label>
                        <span>Confirmar PIN</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => handlePinRecoveryFieldChange('confirmPin', event.target.value.replace(/\D/g, ''))}
                          placeholder="Repita o PIN"
                          type="password"
                          value={pinRecoveryForm.confirmPin}
                        />
                      </label>
                    </div>
                    <div className="barber-settings-hint">
                      <Clock />
                      <span>Use apenas numeros. O novo PIN precisa ter pelo menos 4 digitos.</span>
                    </div>
                    <div className="barber-settings-actions">
                      <Button disabled={pinRecoverySubmitting} type="submit" variant="primary">
                        <Check />
                        <span>{pinRecoverySubmitting ? 'Salvando PIN...' : 'Salvar novo PIN'}</span>
                      </Button>
                      <Button onClick={() => resetPinRecoveryFlow(pinRecoveryForm.email)} type="button" variant="ghost">
                        <X />
                        <span>Cancelar</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}

            {!pinRecoveryOpen ? (
              <div className="barber-settings-meta">
                <div className="barber-settings-meta-item">
                  <span>E-mail padrao</span>
                  <strong>{settingsData.security?.recovery_email || user?.email || '-'}</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Ultima revisao da area</span>
                  <strong>{settingsData.company?.created_at ? fullDate(settingsData.company.created_at) : 'Nao informado'}</strong>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      </>
    )
  }

  return (
    <>
      <div className="barber-settings-menu-header">
        <span className="barber-overline">Configuracoes do sistema</span>
        <h3>Selecione uma area para configurar</h3>
      </div>
      <div className="barber-settings-menu-grid">
        <button className="barber-settings-menu-card" onClick={() => setSettingsSection('general')}>
          <div className="barber-settings-menu-card-icon">
            <Settings size={28} />
          </div>
          <div className="barber-settings-menu-card-content">
            <strong>Geral</strong>
            <p>Dados da empresa, preferencias operacionais, seguranca e PIN</p>
          </div>
          <ArrowRight size={18} className="barber-settings-menu-card-arrow" />
        </button>

        <button className="barber-settings-menu-card" onClick={() => { setSettingsSection('branding'); loadBranding() }}>
          <div className="barber-settings-menu-card-icon">
            <Palette size={28} />
          </div>
          <div className="barber-settings-menu-card-content">
            <strong>Identidade visual da empresa</strong>
            <p>Logo, nome comercial, cores principais e identidade da marca</p>
          </div>
          <ArrowRight size={18} className="barber-settings-menu-card-arrow" />
        </button>

        <button className="barber-settings-menu-card" onClick={() => setSettingsSection('booking-landing')}>
          <div className="barber-settings-menu-card-icon">
            <Calendar size={28} />
          </div>
          <div className="barber-settings-menu-card-content">
            <strong>Configuracoes da agenda online</strong>
            <p>Banner, galeria, texto de apresentacao, layout e preview da agenda publica</p>
          </div>
          <ArrowRight size={18} className="barber-settings-menu-card-arrow" />
        </button>

        <button className="barber-settings-menu-card" onClick={() => { setSettingsSection('integrations') }}>
          <div className="barber-settings-menu-card-icon">
            <MessageSquare size={28} />
          </div>
          <div className="barber-settings-menu-card-content">
            <strong>Integrações</strong>
            <p>Conecte o WhatsApp Business para enviar notificações automáticas de agendamento</p>
          </div>
          <ArrowRight size={18} className="barber-settings-menu-card-arrow" />
        </button>
      </div>
    </>
  )
}
