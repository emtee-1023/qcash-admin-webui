import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { Avatar, Button, Card, EmptyState, IconButton, KycBadge, PageHeader, Pagination, SearchField, Select, StatusBadge } from '../components/ui'
import { businesses as seedBusinesses, countByKyc, type BusinessStatus, type KycStatus } from '../data/mock'
import { formatDate, formatKES } from '../lib/format'
import { navigate } from '../lib/router'

const pageSize = 8

export function BusinessesPage() {
  const toast = useToast()
  const [rows, setRows] = useState(seedBusinesses)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [kyc, setKyc] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const typeOptions = Array.from(new Set(seedBusinesses.map((business) => business.businessType))).sort()

  const filtered = rows.filter((business) => {
    const search = query.trim().toLowerCase()
    const matchesSearch =
      !search ||
      business.name.toLowerCase().includes(search) ||
      business.publicId.toLowerCase().includes(search) ||
      business.businessType.toLowerCase().includes(search) ||
      business.county.toLowerCase().includes(search) ||
      business.owners.some(
        (owner) =>
          owner.name.toLowerCase().includes(search) || owner.phone.toLowerCase().includes(search),
      )
    const matchesStatus = status === 'all' || business.status === status
    const matchesKyc = kyc === 'all' || business.kycStatus === kyc
    const matchesType = type === 'all' || business.businessType === type
    return matchesSearch && matchesStatus && matchesKyc && matchesType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(filtered.length, safePage * pageSize)
  const filtersActive = query !== '' || status !== 'all' || kyc !== 'all' || type !== 'all'
  const pendingKyc = countByKyc('pending')

  function resetFilters() {
    setQuery('')
    setStatus('all')
    setKyc('all')
    setType('all')
    setPage(1)
  }

  function approveKyc(id: number) {
    setRows((current) =>
      current.map((business) =>
        business.id === id ? { ...business, kycStatus: 'verified' as KycStatus } : business,
      ),
    )
    toast('KYC verified. The business can now transact.', 'success')
  }

  function toggleStatus(id: number) {
    const business = rows.find((item) => item.id === id)
    if (!business) return
    const nextStatus: BusinessStatus = business.status === 'suspended' ? 'active' : 'suspended'
    setRows((current) =>
      current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
    )
    toast(
      nextStatus === 'suspended' ? 'Business suspended.' : 'Business reactivated.',
      nextStatus === 'suspended' ? 'info' : 'success',
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Businesses"
        description="Review onboarding, verify KYC and manage the status of every business on QCash."
        actions={
          <>
            <Button
              variant="secondary"
              iconLeft="download"
              onClick={() => toast('Business export queued (design preview).', 'info')}
            >
              Export
            </Button>
            <Button iconLeft="shield" onClick={() => { setKyc('pending'); setPage(1) }}>
              Review KYC {pendingKyc > 0 ? `(${pendingKyc})` : ''}
            </Button>
          </>
        }
      />

      <div className="toolbar">
        <SearchField
          className="toolbar__search"
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          placeholder="Search by business, owner, phone or ID…"
        />
        <div className="toolbar__select">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <div className="toolbar__select">
          <Select
            aria-label="Filter by KYC status"
            value={kyc}
            onChange={(event) => {
              setKyc(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All KYC</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="unverified">Unverified</option>
          </Select>
        </div>
        <div className="toolbar__select">
          <Select
            aria-label="Filter by business type"
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        {filtersActive && (
          <button type="button" className="toolbar__reset" onClick={resetFilters}>
            Reset
          </button>
        )}
        <span className="toolbar__spacer" />
        <span className="toolbar__meta">
          {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'}
        </span>
      </div>

      <Card className="table-card" padded={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="businesses"
            title="No businesses found"
            description="Try a different search term or clear your filters to see all businesses."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="desktop-table">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>KYC</th>
                      <th>Wallet</th>
                      <th>Joined</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((business) => (
                      <tr
                        key={business.id}
                        onClick={() => navigate(`/businesses/${business.id}`)}
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
                          <div className="cell-strong" style={{ fontSize: '0.79rem' }}>
                            {business.businessType}
                          </div>
                          <span style={{ fontSize: '0.71rem', color: 'var(--muted)' }}>
                            {business.businessCategory}
                          </span>
                        </td>
                        <td>
                          {business.town}
                          <div style={{ fontSize: '0.71rem', color: 'var(--muted)' }}>
                            {business.county}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={business.status} />
                        </td>
                        <td>
                          <KycBadge status={business.kycStatus} />
                        </td>
                        <td className="mono">{formatKES(business.walletBalanceMinor, { compact: true })}</td>
                        <td className="nowrap">{formatDate(business.createdAt)}</td>
                        <td>
                          <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                            {business.kycStatus === 'pending' && (
                              <Button size="sm" variant="success" onClick={() => approveKyc(business.id)}>
                                Approve
                              </Button>
                            )}
                            <IconButton
                              icon={business.status === 'suspended' ? 'refresh' : 'ban'}
                              label={
                                business.status === 'suspended'
                                  ? 'Reactivate business'
                                  : 'Suspend business'
                              }
                              onClick={() => toggleStatus(business.id)}
                            />
                            <IconButton
                              icon="eye"
                              label="View business"
                              onClick={() => navigate(`/businesses/${business.id}`)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mobile-cards">
              {paged.map((business) => (
                <div key={business.id} className="mobile-card">
                  <div className="mobile-card__top">
                    <div className="table-business">
                      <Avatar name={business.name} size={40} />
                      <div className="table-business__meta">
                        <strong>{business.name}</strong>
                        <span>{business.publicId}</span>
                      </div>
                    </div>
                    <StatusBadge status={business.status} />
                  </div>
                  <div className="mobile-card__stats">
                    <span>
                      Compliance
                      <KycBadge status={business.kycStatus} />
                    </span>
                    <span>
                      Wallet
                      <strong>{formatKES(business.walletBalanceMinor, { compact: true })}</strong>
                    </span>
                    <span>
                      Location
                      <strong>{business.town}</strong>
                    </span>
                    <span>
                      Joined
                      <strong>{formatDate(business.createdAt)}</strong>
                    </span>
                  </div>
                  <div className="mobile-card__actions">
                    {business.kycStatus === 'pending' && (
                      <Button size="sm" variant="success" onClick={() => approveKyc(business.id)}>
                        Approve KYC
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/businesses/${business.id}`)}>
                      View business
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-footer">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
                totalLabel={`Showing ${rangeStart}–${rangeEnd} of ${filtered.length} businesses`}
              />
            </div>
          </>
        )}
      </Card>
    </>
  )
}
