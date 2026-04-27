import MasterLayout from './MasterLayout'
import PageHeader from './PageHeader'
import SectionCard from './SectionCard'

function EmptyMasterPage({ title, description }) {
  return (
    <MasterLayout title={title}>
      <PageHeader title={title} description={description} />
      <SectionCard title={title}>
        <p className="master-premium-empty">
          Esta area ainda nao possui dados conectados ou funcionalidades cadastradas.
        </p>
      </SectionCard>
    </MasterLayout>
  )
}

export default EmptyMasterPage
