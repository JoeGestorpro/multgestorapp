function StatCard({ label, value, detail }) {
  return (
    <article className="master-premium-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </article>
  )
}

export default StatCard
