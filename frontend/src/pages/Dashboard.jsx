import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { manifiestosService } from '../services/manifiestosService'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardMetrics from '../components/dashboard/DashboardMetrics'
import DashboardShortcuts from '../components/dashboard/DashboardShortcuts'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const isConductor = user?.role === 'conductor'
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    if (isConductor) return
    let cancelled = false
    manifiestosService.getOverview().then((res) => {
      if (!cancelled && res?.success) setOverview(res.data)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [isConductor])

  return (
    <div className="space-y-6">
      <DashboardHeader username={user?.username} role={user?.role} />
      {!isConductor && (
        <DashboardMetrics
          totalPdfs={overview?.pdfs?.length || 0}
          totalCarpetas={overview?.folders?.length || 0}
        />
      )}
      <DashboardShortcuts isAdmin={isAdmin} isConductor={isConductor} />
    </div>
  )
}
