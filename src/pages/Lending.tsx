import { useData } from '../components/data-context'
import { Icon, type IconName } from '../components/icons'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  StatusBadge,
} from '../components/ui'
import { formatApr, formatKES } from '../lib/format'
import { navigate } from '../lib/router'

export function LendingPage() {
  const { lending, loading, error, refresh } = useData()

  if (loading) {
    return <Card><LoadingState label="Loading lending data" /></Card>
  }

  if (error) {
    return <Card><ErrorState message={error} onRetry={() => void refresh()} /></Card>
  }

  const summary = lending?.summary
  const businesses = lending?.businesses ?? []

  if (!summary) {
    return (
      <Card>
        <EmptyState
          icon="banknote"
          title="Lending data unavailable"
          description="The lending endpoint did not return any data. Make sure the backend exposes the admin lending route."
          action={
            <Button variant="secondary" onClick={() => void refresh()}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  const stats: Array<{
    label: string
    value: string
    foot: string
    icon: IconName
    tone: string
  }> = [
    {
      label: 'Total lent out',
      value: formatKES(summary.disbursedPrincipalMinor, { compact: true }),
      foot: `${summary.disbursedLoansCount} disbursed of ${summary.loansCount} advances`,
      icon: 'banknote',
      tone: 'green',
    },
    {
      label: 'Repaid to date',
      value: formatKES(summary.repaidMinor, { compact: true }),
      foot: `${formatKES(summary.principalRepaidMinor, { compact: true })} principal · ${formatKES(summary.feeRepaidMinor, { compact: true })} fees`,
      icon: 'checkCircle',
      tone: 'blue',
    },
    {
      label: 'Outstanding',
      value: formatKES(summary.outstandingMinor, { compact: true }),
      foot: `${summary.activeLoansCount} active · ${summary.overdueLoansCount} overdue`,
      icon: 'activity',
      tone: 'amber',
    },
    {
      label: 'Average APR (minimum)',
      value: formatApr(summary.weightedAprBps),
      foot: `Principal-weighted across ${summary.disbursedLoansCount} loans`,
      icon: 'trendUp',
      tone: 'purple',
    },
  ]

  const repaymentRate =
    summary.disbursedPrincipalMinor > 0
      ? Math.min(100, (summary.principalRepaidMinor / summary.disbursedPrincipalMinor) * 100)
      : 0

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Lending"
        description="Cash advances across the QCash network: how much is out, how much has been repaid and the annualised cost of credit. APR uses the contractual repayment window, so treat it as the minimum possible rate."
      />

      <div className="stat-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <div className="stat-card__top">
              <span className="icon-chip" data-tone={stat.tone}>
                <Icon name={stat.icon} size={20} />
              </span>
            </div>
            <div>
              <div className="stat-card__value mono">{stat.value}</div>
              <div className="stat-card__label">{stat.label}</div>
            </div>
            <div className="stat-card__foot">{stat.foot}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--even" style={{ marginTop: 16 }}>
        <Card>
          <CardHeader
            title="Portfolio recovery"
            subtitle="Principal repaid against total principal lent"
            action={
              <Badge tone={summary.overdueLoansCount > 0 ? 'amber' : 'green'} dot>
                {summary.overdueLoansCount > 0 ? `${summary.overdueLoansCount} overdue` : 'On track'}
              </Badge>
            }
          />
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: '0.78rem' }}>
              {formatKES(summary.principalRepaidMinor, { compact: true })} of{' '}
              {formatKES(summary.disbursedPrincipalMinor, { compact: true })} principal
            </span>
            <strong className="mono" style={{ fontSize: '0.82rem' }}>
              {repaymentRate.toFixed(1)}%
            </strong>
          </div>
          <ProgressBar value={repaymentRate} />
          <div className="mini-stats">
            <div className="mini-stat">
              <strong>{summary.activeLoansCount}</strong>
              <span>Active advances</span>
            </div>
            <div className="mini-stat">
              <strong>{summary.settledLoansCount}</strong>
              <span>Settled advances</span>
            </div>
            <div className="mini-stat">
              <strong>{summary.overdueLoansCount}</strong>
              <span>Overdue advances</span>
            </div>
            <div className="mini-stat">
              <strong>{formatKES(summary.feesMinor, { compact: true })}</strong>
              <span>Fees assessed</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="APR context" subtitle="How the platform average is derived" />
          <div className="account-line">
            <span className="account-line__label">Weighted average APR</span>
            <span className="account-line__value">{formatApr(summary.weightedAprBps)}</span>
          </div>
          <div className="account-line">
            <span className="account-line__label">Simple average APR</span>
            <span className="account-line__value">{formatApr(summary.averageAprBps)}</span>
          </div>
          <div className="account-line">
            <span className="account-line__label">Total repayable</span>
            <span className="account-line__value">
              {formatKES(summary.totalRepayableMinor, { compact: true })}
            </span>
          </div>
          <div className="account-line">
            <span className="account-line__label">Defaulted advances</span>
            <span className="account-line__value">{summary.defaultedLoansCount}</span>
          </div>
          <div className="inline-alert inline-alert--info" style={{ marginTop: 16 }}>
            <Icon name="info" size={15} />
            <span>
              APR is annualised over the contractual term. If a business takes longer to repay, its
              realised APR is higher.
            </span>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
      <Card className="table-card" padded={false}>
        {businesses.length === 0 ? (
          <EmptyState
            icon="banknote"
            title="No lending activity yet"
            description="No business has taken a cash advance so far."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Loans</th>
                  <th>Total lent</th>
                  <th>Repaid</th>
                  <th>Outstanding</th>
                  <th>APR (minimum)</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr
                    key={business.businessId}
                    onClick={() => navigate(`/businesses/${business.businessId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="table-business">
                        <Avatar name={business.name} size={38} />
                        <div className="table-business__meta">
                          <strong>{business.name}</strong>
                          <span>{business.publicId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-strong">{business.summary.loansCount}</div>
                      <span style={{ fontSize: '0.71rem', color: 'var(--muted)' }}>
                        {business.summary.settledLoansCount} settled
                      </span>
                    </td>
                    <td className="mono">
                      {formatKES(business.summary.disbursedPrincipalMinor, { compact: true })}
                    </td>
                    <td className="mono">
                      {formatKES(business.summary.repaidMinor, { compact: true })}
                    </td>
                    <td className="mono">
                      {formatKES(business.summary.outstandingMinor, { compact: true })}
                    </td>
                    <td>
                      <Badge tone={business.summary.weightedAprBps > 0 ? 'purple' : 'gray'}>
                        {formatApr(business.summary.weightedAprBps)}
                      </Badge>
                    </td>
                    <td>
                      <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                        <StatusBadge status={business.status ?? 'pending'} />
                        <Button
                          size="sm"
                          variant="ghost"
                          iconRight="arrowRight"
                          onClick={() => navigate(`/businesses/${business.businessId}`)}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </div>
    </>
  )
}
