import { useMemo, useState } from 'react'
import { useToast } from '../components/toast-context'
import { useAuth } from '../components/auth-context'
import { useData } from '../components/data-context'
import { Icon, type IconName } from '../components/icons'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  KycBadge,
  LoadingState,
  ProgressBar,
  Segmented,
  TrendPill,
} from '../components/ui'
import type { AdminUser, Business } from '../data/types'
import { formatApr, formatKES, timeAgo } from '../lib/format'
import { navigate } from '../lib/router'

type Trend = {
  months: string[]
  businesses: number[]
  users: number[]
}

type ActivityItem = {
  id: string
  actor: string
  action: string
  target: string
  meta: string
  time: string
  tone: string
  icon: IconName
}

function cumulative(values: number[]) {
  let total = 0
  return values.map((value) => {
    total += value
    return total
  })
}

function buildTrend(businesses: Business[], users: AdminUser[], range: '6m' | '12m'): Trend {
  const length = range === '6m' ? 6 : 12
  const now = new Date()
  const months = Array.from({ length }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (length - 1 - index), 1)
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-GB', { month: 'short' }),
    }
  })

  const countByMonth = (records: Array<{ createdAt: string | null }>) =>
    months.map((month) =>
      records.filter((record) => record.createdAt?.startsWith(month.key)).length,
    )

  return {
    months: months.map((month) => month.label),
    businesses: cumulative(countByMonth(businesses)),
    users: cumulative(countByMonth(users)),
  }
}

function buildPoints(values: number[], width: number, height: number, pad: number, max: number) {
  const innerWidth = width - pad * 2
  const innerHeight = height - pad - 26
  const step = values.length > 1 ? innerWidth / (values.length - 1) : innerWidth
  return values.map((value, index) => ({
    x: pad + index * step,
    y: pad + innerHeight - (value / max) * innerHeight,
  }))
}

function toLine(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
}

function GrowthChart({ trend }: { trend: Trend }) {
  const width = 680
  const height = 250
  const pad = 34
  const max = Math.max(1, ...trend.businesses, ...trend.users)
  const axisMax = Math.max(4, Math.ceil(max / 4) * 4)
  const businessPoints = buildPoints(trend.businesses, width, height, pad, axisMax)
  const userPoints = buildPoints(trend.users, width, height, pad, axisMax)
  const baseline = height - 26
  const areaPath = `${toLine(businessPoints)} L${businessPoints[businessPoints.length - 1].x.toFixed(1)} ${baseline} L${businessPoints[0].x.toFixed(1)} ${baseline} Z`
  const gridValues = [0, 1, 2, 3, 4].map((index) => (index * axisMax) / 4)

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span>
          <span className="legend-dot" style={{ background: '#1DAB87' }} />
          Businesses
        </span>
        <span>
          <span className="legend-dot" style={{ background: '#7B61FF' }} />
          Users
        </span>
      </div>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative businesses and users on QCash">
        <defs>
          <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1DAB87" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1DAB87" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((value) => {
          const y = pad + (height - pad - 26) - (value / axisMax) * (height - pad - 26)
          return (
            <g key={value}>
              <line className="chart-grid-line" x1={pad} y1={y} x2={width - pad} y2={y} />
              <text className="chart-axis-label" x={pad - 10} y={y + 4} textAnchor="end">
                {value}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#growth-fill)" />
        <path d={toLine(userPoints)} fill="none" stroke="#7B61FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={toLine(businessPoints)} fill="none" stroke="#1DAB87" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {trend.months.map((month, index) => (
          <text
            key={`${month}-${index}`}
            className="chart-axis-label"
            x={businessPoints[index].x}
            y={height - 6}
            textAnchor="middle"
          >
            {month}
          </text>
        ))}
        {businessPoints.map((point, index) => (
          <circle key={`b-${index}`} cx={point.x} cy={point.y} r={index === businessPoints.length - 1 ? 4.5 : 2.6} fill="#ffffff" stroke="#1DAB87" strokeWidth="2" />
        ))}
        {userPoints.map((point, index) => (
          <circle key={`u-${index}`} cx={point.x} cy={point.y} r={index === userPoints.length - 1 ? 4 : 2.3} fill="#ffffff" stroke="#7B61FF" strokeWidth="1.8" />
        ))}
        <text className="chart-value-label" x={businessPoints[businessPoints.length - 1].x - 6} y={businessPoints[businessPoints.length - 1].y - 12} textAnchor="end">
          {trend.businesses[trend.businesses.length - 1]} businesses
        </text>
      </svg>
    </div>
  )
}

export function OverviewPage() {
  const toast = useToast()
  const { user } = useAuth()
  const { businesses, users, lending, loading, error, refresh } = useData()
  const [range, setRange] = useState<'6m' | '12m'>('12m')

  const trend = useMemo(() => buildTrend(businesses, users, range), [businesses, range, users])

  if (loading) {
    return <Card><LoadingState label="Loading dashboard" /></Card>
  }

  if (error) {
    return <Card><ErrorState message={error} onRetry={() => void refresh()} /></Card>
  }

  const totalBusinesses = businesses.length
  const activeBusinesses = businesses.filter((business) => business.status === 'active').length
  const pendingKyc = businesses.filter((business) => business.kycStatus === 'pending').length
  const verified = businesses.filter((business) => business.kycStatus === 'verified').length
  const rejected = businesses.filter((business) => business.kycStatus === 'rejected').length
  const unverified = businesses.filter((business) => business.kycStatus === 'unverified').length
  const totalUsers = users.length
  const admins = users.filter((item) => item.isAdmin).length
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const newThisMonth = businesses.filter((business) => business.createdAt?.startsWith(monthKey)).length
  const countySet = new Set(businesses.map((business) => business.county).filter(Boolean))

  const verifiedPct = totalBusinesses ? (verified / totalBusinesses) * 100 : 0
  const pendingPct = totalBusinesses ? (pendingKyc / totalBusinesses) * 100 : 0
  const rejectedPct = totalBusinesses ? (rejected / totalBusinesses) * 100 : 0
  const verifiedAngle = verifiedPct
  const pendingAngle = verifiedPct + pendingPct
  const rejectedAngle = pendingAngle + rejectedPct

  const queue = businesses
    .filter((business) => business.kycStatus === 'pending')
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const countyCounts = businesses.reduce<Record<string, number>>((accumulator, business) => {
    const county = business.county ?? 'Unknown'
    accumulator[county] = (accumulator[county] ?? 0) + 1
    return accumulator
  }, {})
  const topCounties = Object.entries(countyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const activity: ActivityItem[] = [
    ...businesses
      .filter((business) => business.kycStatus === 'verified')
      .slice(0, 3)
      .map((business): ActivityItem => ({
        id: `kyc-${business.id}`,
        actor: 'Compliance team',
        action: 'verified KYC for',
        target: business.name,
        meta: 'Compliance',
        time: business.updatedAt ?? business.createdAt ?? new Date().toISOString(),
        tone: 'green',
        icon: 'shield',
      })),
    ...businesses
      .filter((business) => business.status === 'pending')
      .slice(0, 3)
      .map((business): ActivityItem => ({
        id: `business-${business.id}`,
        actor: 'System',
        action: 'received a new business application from',
        target: business.name,
        meta: 'Onboarding',
        time: business.createdAt ?? new Date().toISOString(),
        tone: 'blue',
        icon: 'businesses',
      })),
    ...users
      .filter((item) => item.isAdmin && item.adminActivatedAt)
      .slice(0, 3)
      .map((item): ActivityItem => ({
        id: `admin-${item.id}`,
        actor: 'Admin team',
        action: 'granted console access to',
        target: item.name,
        meta: 'Users',
        time: item.adminActivatedAt ?? item.updatedAt ?? new Date().toISOString(),
        tone: 'purple',
        icon: 'userPlus',
      })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const stats = [
    {
      label: 'Total businesses',
      value: totalBusinesses,
      icon: 'businesses' as IconName,
      tone: 'green',
      trend: `${newThisMonth} this month`,
      foot: `Across ${countySet.size} counties`,
    },
    {
      label: 'Active businesses',
      value: activeBusinesses,
      icon: 'activity' as IconName,
      tone: 'blue',
      trend: `${totalBusinesses ? Math.round((activeBusinesses / totalBusinesses) * 100) : 0}% of total`,
      foot: 'Transacting on QCash',
    },
    {
      label: 'KYC pending',
      value: pendingKyc,
      icon: 'shield' as IconName,
      tone: 'amber',
      trend: 'Needs review',
      foot: 'Awaiting compliance review',
    },
    {
      label: 'Platform users',
      value: totalUsers,
      icon: 'users' as IconName,
      tone: 'purple',
      trend: `${admins} admins`,
      foot: 'Business owners & staff',
    },
  ]

  return (
    <>
      <div className="overview-top">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Welcome back, {user?.name.split(' ')[0] ?? 'admin'}</h1>
          <p>{today} · Here&apos;s what&apos;s happening across the QCash network.</p>
        </div>
        <div className="overview-actions">
          <Button
            variant="secondary"
            iconLeft="download"
            onClick={() => toast('Export is not available through the admin API.', 'info')}
          >
            Export
          </Button>
          <Button iconLeft="shield" onClick={() => navigate('/businesses')}>
            Review KYC queue
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <div className="stat-card__top">
              <span className="icon-chip" data-tone={stat.tone}>
                <Icon name={stat.icon} size={20} />
              </span>
              <TrendPill value={stat.trend} muted={stat.label === 'KYC pending'} />
            </div>
            <div>
              <div className="stat-card__value mono">{stat.value}</div>
              <div className="stat-card__label">{stat.label}</div>
            </div>
            <div className="stat-card__foot">{stat.foot}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card>
          <CardHeader
            title="Platform growth"
            subtitle="Cumulative businesses and users on QCash"
            action={
              <Segmented
                value={range}
                onChange={(value) => setRange(value as '6m' | '12m')}
                options={[
                  { value: '6m', label: '6M' },
                  { value: '12m', label: '12M' },
                ]}
              />
            }
          />
          <GrowthChart trend={trend} />
        </Card>

        <Card className="donut-card">
          <CardHeader title="KYC compliance" subtitle="Verification status across all businesses" />
          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#1DAB87 0% ${verifiedAngle}%, #F0A020 ${verifiedAngle}% ${pendingAngle}%, #E5484D ${pendingAngle}% ${rejectedAngle}%, #CBD5E1 ${rejectedAngle}% 100%)`,
              }}
            >
              <div className="donut__center">
                <strong>{Math.round(verifiedPct)}%</strong>
                <span>verified</span>
              </div>
            </div>
            <div className="kyc-legend">
              <div className="kyc-legend__row">
                <span className="kyc-legend__label">
                  <span className="legend-dot" style={{ background: '#1DAB87' }} />
                  Verified
                </span>
                <span className="kyc-legend__value">{verified}</span>
              </div>
              <div className="kyc-legend__row">
                <span className="kyc-legend__label">
                  <span className="legend-dot" style={{ background: '#F0A020' }} />
                  Pending
                </span>
                <span className="kyc-legend__value">{pendingKyc}</span>
              </div>
              <div className="kyc-legend__row">
                <span className="kyc-legend__label">
                  <span className="legend-dot" style={{ background: '#E5484D' }} />
                  Rejected
                </span>
                <span className="kyc-legend__value">{rejected}</span>
              </div>
              <div className="kyc-legend__row">
                <span className="kyc-legend__label">
                  <span className="legend-dot" style={{ background: '#CBD5E1' }} />
                  Unverified
                </span>
                <span className="kyc-legend__value">{unverified}</span>
              </div>
            </div>
          </div>
          <div className="kyc-note">
            <Icon name="alert" size={16} />
            <span>
              <strong>{pendingKyc} businesses</strong> are waiting on KYC review.{' '}
              <button type="button" className="auth__link" onClick={() => navigate('/businesses')}>
                Review now
              </button>
            </span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card>
          <CardHeader
            title="KYC review queue"
            subtitle="Businesses awaiting verification before they can transact"
            action={
              <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('/businesses')}>
                View all
              </Button>
            }
          />
          <div className="queue-list">
            {queue.length ? (
              queue.slice(0, 5).map((business) => (
                <div key={business.id} className="queue-item">
                  <Avatar name={business.name} size={40} />
                  <div className="queue-item__meta">
                    <strong>{business.name}</strong>
                    <span>
                      {business.businessType} · {business.town ?? business.ward ?? '—'}, {business.county ?? '—'}
                    </span>
                  </div>
                  <div className="queue-item__right">
                    <span className="hide-mobile">
                      <KycBadge status={business.kycStatus} />
                    </span>
                    <Button size="sm" variant="subtle" onClick={() => navigate(`/businesses/${business.id}`)}>
                      Review
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">There are no KYC submissions waiting for review.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            subtitle="Latest records across the console"
            action={
              <button type="button" className="auth__link" onClick={() => navigate('/notifications')}>
                View all
              </button>
            }
          />
          <div className="activity-list">
            {activity.length ? (
              activity.map((item) => (
                <div key={item.id} className="activity-item">
                  <span className="activity-item__dot" data-tone={item.tone}>
                    <Icon name={item.icon} size={15} />
                  </span>
                  <div className="activity-item__body">
                    <p>
                      <strong>{item.actor}</strong> {item.action} <strong>{item.target}</strong>
                    </p>
                    <span>
                      {item.meta} · {timeAgo(item.time)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No recent activity is available.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid--even">
        <Card>
          <CardHeader
            title="Lending snapshot"
            subtitle="Cash advances across the QCash network"
            action={
              <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => navigate('/lending')}>
                View lending
              </Button>
            }
          />
          {lending ? (
            <>
              <div className="mini-stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <div className="mini-stat">
                  <strong>{formatKES(lending.summary.disbursedPrincipalMinor, { compact: true })}</strong>
                  <span>Total lent out</span>
                </div>
                <div className="mini-stat">
                  <strong>{formatKES(lending.summary.repaidMinor, { compact: true })}</strong>
                  <span>Repaid to date</span>
                </div>
                <div className="mini-stat">
                  <strong>{formatKES(lending.summary.outstandingMinor, { compact: true })}</strong>
                  <span>Outstanding</span>
                </div>
                <div className="mini-stat">
                  <strong>{formatApr(lending.summary.weightedAprBps)}</strong>
                  <span>Avg APR (minimum)</span>
                </div>
              </div>
              <div className="section-divider" />
              <div className="row-between">
                <div>
                  <p className="text-strong" style={{ fontSize: '0.83rem' }}>
                    {lending.summary.activeLoansCount} active advances
                  </p>
                  <p className="muted" style={{ fontSize: '0.75rem' }}>
                    {lending.summary.overdueLoansCount} overdue · {lending.summary.settledLoansCount} settled ·{' '}
                    {lending.businesses.length} businesses borrowing
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate('/lending')}>
                  Open
                </Button>
              </div>
            </>
          ) : (
            <p className="muted">Lending data is not available yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Lending health" subtitle="Recovery and pricing at a glance" />
          {lending ? (
            <>
              <div className="account-line">
                <span className="account-line__label">Principal repaid</span>
                <span className="account-line__value">
                  {formatKES(lending.summary.principalRepaidMinor, { compact: true })}
                </span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Fees assessed</span>
                <span className="account-line__value">
                  {formatKES(lending.summary.feesMinor, { compact: true })}
                </span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Weighted avg APR</span>
                <span className="account-line__value">{formatApr(lending.summary.weightedAprBps)}</span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Simple avg APR</span>
                <span className="account-line__value">{formatApr(lending.summary.averageAprBps)}</span>
              </div>
              <div className="inline-alert inline-alert--info" style={{ marginTop: 16 }}>
                <Icon name="info" size={15} />
                <span>APR is annualised over the contractual term, so it is the minimum possible rate.</span>
              </div>
            </>
          ) : (
            <p className="muted">Lending data is not available yet.</p>
          )}
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid--even">
        <Card>
          <CardHeader title="Coverage by county" subtitle="Where QCash businesses are operating" />
          <div className="county-list">
            {topCounties.length ? (
              topCounties.map(([county, count]) => (
                <div key={county} className="county-row">
                  <div className="county-row__top">
                    <strong>{county}</strong>
                    <span>
                      {count} {count === 1 ? 'business' : 'businesses'}
                    </span>
                  </div>
                  <ProgressBar value={totalBusinesses ? (count / totalBusinesses) * 100 : 0} />
                </div>
              ))
            ) : (
              <p className="muted">No businesses are available yet.</p>
            )}
          </div>
          <div className="mini-stats">
            <div className="mini-stat">
              <strong>{formatKES(businesses.reduce((sum, business) => sum + business.walletBalanceMinor, 0), { compact: true })}</strong>
              <span>Wallet balances held</span>
            </div>
            <div className="mini-stat">
              <strong>{businesses.filter((business) => business.collectionAccount).length}</strong>
              <span>Collection accounts linked</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Operations snapshot"
            subtitle="Account and access health"
            action={
              <Badge tone="green" dot>
                Live data
              </Badge>
            }
          />
          <div className="mini-stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <div className="mini-stat">
              <strong>{newThisMonth}</strong>
              <span>New businesses this month</span>
            </div>
            <div className="mini-stat">
              <strong>{businesses.filter((business) => business.status === 'suspended').length}</strong>
              <span>Suspended businesses</span>
            </div>
            <div className="mini-stat">
              <strong>{admins}</strong>
              <span>Active administrators</span>
            </div>
            <div className="mini-stat">
              <strong>{businesses.filter((business) => business.status === 'closed').length}</strong>
              <span>Closed accounts</span>
            </div>
          </div>
          <div className="section-divider" />
          <div className="row-between">
            <div>
              <p className="text-strong" style={{ fontSize: '0.83rem' }}>
                Admin access review
              </p>
              <p className="muted" style={{ fontSize: '0.75rem' }}>
                Keep privileges limited to trusted operators.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/users')}>
              Manage
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
