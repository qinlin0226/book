/**
 * 指标卡片组件，展示单个统计值。
 *
 * @param props 组件参数
 * @return JSX.Element
 */
function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default MetricCard
