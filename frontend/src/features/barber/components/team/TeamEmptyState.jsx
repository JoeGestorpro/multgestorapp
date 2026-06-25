import { Empty } from '../../../../components/design-system'

export default function TeamEmptyState({ isAdmin, hasOperationalCollaborators, onCreate }) {
  return (
    <div className="barber-empty-state">
      <div className="barber-empty-icon">
        <svg className="barber-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <strong style={{ fontSize: 18, color: '#f8fafc' }}>
        {isAdmin
          ? hasOperationalCollaborators
            ? 'Equipe sem movimentacao no periodo'
            : 'Nenhum colaborador cadastrado'
          : 'Sem resumo financeiro'}
      </strong>
      <p style={{ color: 'var(--barber-muted)', margin: 0, fontSize: 14 }}>
        {isAdmin
          ? hasOperationalCollaborators
            ? 'A equipe ja foi cadastrada, mas ainda nao gerou movimentacao no periodo selecionado.'
            : 'Cadastre colaboradores para montar o ranking e a distribuicao das comissoes.'
          : 'Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo.'}
      </p>
      {isAdmin && !hasOperationalCollaborators && onCreate && (
        <button className="barber-button barber-button-primary" onClick={onCreate} type="button">
          Adicionar primeiro colaborador
        </button>
      )}
    </div>
  )
}
