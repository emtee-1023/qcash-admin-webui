import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { Icon, type IconName } from '../components/icons'
import { Avatar, Badge, Button, Card, CardHeader, KycBadge, ProgressBar, Segmented, TrendPill } from '../components/ui'
import { activityFeed, businesses, countByKyc, countByStatus, currentAdmin, registrationTrend, users } from '../data/mock'
import { formatKES, timeAgo } from '../lib/format'
import { navigate } from '../lib/router'

function cumulative(values: number[]) {
  let total = 0
  return values.map((value) => {
    total += value
    return total
  })
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

function GrowthChart({ range }: { range: '6m' | '12m' }) {
  const allBusinesses = cumulative(registrationTrend.businesses)
  const allUsers = cumulative(registrationTrend.users)
  const slice = range === '6m' ? -6 : undefined
  const businessSeries = slice ? allBusinesses.slice(slice) : allBusinesses
  const userSeries = slice ? allUsers.slice(slice) : allUsers
  const months = slice ? registrationTrend.months.slice(slice) : registrationTrend.months

  const width = 680
  const height = 250
  const pad = 34
  const max = 16
  const businessPoints = buildPoints(businessSeries, width, height, pad, max)
  const userPoints = buildPoints(userSeries, width, height, pad, max)
  const baseline = height - 26
  const areaPath = `${toLine(businessPoints)} L${businessPoints[businessPoints.length - 1].x.toFixed(1)} ${baseline} L${businessPoints[0].x.toFixed(1)} ${baseline} Z`
  const gridValues = [0, 4, 8, 12, 16]

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
          const y = pad + (height - pad - 26) - (value / max) * (height - pad - 26)
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
        <path d={toLine(userPoints)} fill="none" stroke="#7B61FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 0" opacity="0.9" />
        <path d={toLine(businessPoints)} fill="none" stroke="#1DAB87" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((month, index) => (
          <text
            key={month}
            className="chart-axis-label"
            x={businessPoints[index].x}
            y={height - 6}
            textAnchor="middle"
          >
            {month}
          </text>
        ))}
        {businessPoints.map((point, index) => (
          <circle key={`b-${months[index]}`} cx={point.x} cy={point.y} r={index === businessPoints.length - 1 ? 4.5 : 2.6} fill="#ffffff" stroke="#1DAB87" strokeWidth="2" />
        ))}
        {userPoints.map((point, index) => (
          <circle key={`u-${months[index]}`} cx={point.x} cy={point.y} r={index === userPoints.length - 1 ? 4 : 2.3} fill="#ffffff" stroke="#7B61FF" strokeWidth="1.8" />
        ))}
        <text className="chart-value-label" x={businessPoints[businessPoints.length - 1].x - 6} y={businessPoints[businessPoints.length - 1].y - 12} textAnchor="end">
          {businessSeries[businessSeries.length - 1]} businesses
        </text>
      </svg>
    </div>
  )
}

const activityIcon: Record<string, IconName> = {
  Compliance: 'shield',
  Onboarding: 'businesses',
  Business: 'edit',
  Users: 'userPlus',
}

export function OverviewPage() {
  const toast = useToast()
  const [range, setRange] = useState<'6m' | '12m'>('12m')
  const totalBusinesses = businesses.length
  const activeBusinesses = countByStatus('active')
  const pendingKyc = countByKyc('pending')
  const totalUsers = users.length
  const verified = countByKyc('verified')
  const rejected = countByKyc('rejected')
  const unverified = countByKyc('unverified')
  const admins = users.filter((user) => user.isAdmin).length
  const newThisMonth = businesses.filter((business) => business.createdAt.startsWith('2026-11')).length

  const verifiedPct = (verified / totalBusinesses) * 100
  const pendingPct = (pendingKyc / totalBusinesses) * 100
  const rejectedPct = (rejected / totalBusinesses) * 100
  const verifiedAngle = verifiedPct
  const pendingAngle = verifiedPct + pendingPct
  const rejectedAngle = pendingAngle + rejectedPct

  const queue = businesses
    .filter((business) => business.kycStatus === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const countyCounts = businesses.reduce<Record<string, number>>((accumulator, business) => {
    accumulator[business.county] = (accumulator[business.county] ?? 0) + 1
    return accumulator
  }, {})
  const topCounties = Object.entries(countyCounts)
    .sort(([, a], [, b]) => b - a)
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
      foot: 'Across 8 counties',
    },
    {
      label: 'Active businesses',
      value: activeBusinesses,
      icon: 'activity' as IconName,
      tone: 'blue',
      trend: `${Math.round((activeBusinesses / totalBusinesses) * 100)}% of total`,
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
          <h1>Welcome back, {currentAdmin.name.split(' ')[0]}</h1>
          <p>{today} · Here&apos;s what&apos;s happening across the QCash network.</p>
        </div>
        <div className="overview-actions">
          <Button variant="secondary" iconLeft="download" onClick={() => toast('Report export queued (design preview).', 'info')}>
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
          <GrowthChart range={range} />
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
            {queue.map((business) => (
              <div key={business.id} className="queue-item">
                <Avatar name={business.name} size={40} />
                <div className="queue-item__meta">
                  <strong>{business.name}</strong>
                  <span>
                    {business.businessType} · {business.town}, {business.county}
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
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            subtitle="Latest actions across the console"
            action={
              <button type="button" className="auth__link" onClick={() => navigate('/notifications')}>
                View all
              </button>
            }
          />
          <div className="activity-list">
            {activityFeed.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-item">
                <span className="activity-item__dot" data-tone={item.tone}>
                  <Icon name={activityIcon[item.meta] ?? 'activity'} size={15} />
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
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid--even">
        <Card>
          <CardHeader title="Coverage by county" subtitle="Where QCash businesses are operating" />
          <div className="county-list">
            {topCounties.map(([county, count]) => (
              <div key={county} className="county-row">
                <div className="county-row__top">
                  <strong>{county}</strong>
                  <span>
                    {count} {count === 1 ? 'business' : 'businesses'}
                  </span>
                </div>
                <ProgressBar value={(count / totalBusinesses) * 100} />
              </div>
            ))}
          </div>
          <div className="mini-stats">
            <div className="mini-stat">
              <strong>{formatKES(businesses.reduce((sum, business) => sum + business.walletBalanceMinor, 0), { compact: true })}</strong>
              <span>Wallet balances held</span>
            </div>
            <div className="mini-stat">
              <strong>{formatKES(businesses.reduce((sum, business) => sum + business.monthlyInflowMinor, 0), { compact: true })}</strong>
              <span>Monthly inflow tracked</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Operations snapshot"
            subtitle="Account and access health"
            action={
              <Badge tone="green" dot>
                All systems normal
              </Badge>
            }
          />
          <div className="mini-stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <div className="mini-stat">
              <strong>{newThisMonth}</strong>
              <span>New businesses this month</span>
            </div>
            <div className="mini-stat">
              <strong>{countByStatus('suspended')}</strong>
              <span>Suspended businesses</span>
            </div>
            <div className="mini-stat">
              <strong>{admins}</strong>
              <span>Active administrators</span>
            </div>
            <div className="mini-stat">
              <strong>{countByStatus('closed')}</strong>
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
