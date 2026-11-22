import { useState } from 'react'
import { useToast } from '../components/toast-context'
import {
  AdminBadge,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  SearchField,
  Segmented,
} from '../components/ui'
import { useAuth } from '../components/auth-context'
import { useData } from '../components/data-context'
import { api } from '../lib/api'
import { mapUser } from '../data/mappers'
import type { AdminUser } from '../data/types'
import { formatDate, titleCase } from '../lib/format'
import { navigate } from '../lib/router'

const pageSize = 8

export function UsersPage() {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const { users, loading, error, refresh, applyUser } = useData()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)

  const admins = users.filter((user) => user.isAdmin).length

  const filtered = users.filter((user) => {
    const search = query.trim().toLowerCase()
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      (user.email ?? '').toLowerCase().includes(search) ||
      (user.phone ?? '').toLowerCase().includes(search) ||
      (user.identificationNumber ?? '').toLowerCase().includes(search)
    const matchesRole =
      role === 'all' || (role === 'admins' ? user.isAdmin : !user.isAdmin)
    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(filtered.length, safePage * pageSize)
  const filtersActive = query !== '' || role !== 'all'

  function resetFilters() {
    setQuery('')
    setRole('all')
    setPage(1)
  }

  async function toggleAdmin(user: AdminUser) {
    if (user.id === currentUser?.id) return
    setBusyId(user.id)
    try {
      const response = user.isAdmin
        ? await api.revokeAdmin(user.id)
        : await api.grantAdmin(user.id)
      applyUser(mapUser(response.data))
      toast(
        response.message ||
          (user.isAdmin
            ? `Admin access revoked for ${user.name}.`
            : `Admin access granted to ${user.name}.`),
        user.isAdmin ? 'info' : 'success',
      )
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update admin access.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Users"
        description="Manage business owners, staff and administrators across the QCash network."
        actions={
          <>
            <Button
              variant="secondary"
              iconLeft="download"
              onClick={() => toast('Export is not available through the admin API.', 'info')}
            >
              Export
            </Button>
            <Button
              iconLeft="shield"
              disabled={loading}
              onClick={() => {
                setRole('admins')
                setPage(1)
              }}
            >
              Manage admins ({admins})
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
          placeholder="Search by name, phone, email or ID…"
        />
        <Segmented
          value={role}
          onChange={(value) => {
            setRole(value)
            setPage(1)
          }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'admins', label: 'Admins' },
            { value: 'customers', label: 'Customers' },
          ]}
        />
        {filtersActive && (
          <button type="button" className="toolbar__reset" onClick={resetFilters}>
            Reset
          </button>
        )}
        <span className="toolbar__spacer" />
        <span className="toolbar__meta">
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      <Card className="table-card" padded={false}>
        {loading ? (
          <LoadingState label="Loading users" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title="No users found"
            description="Try a different search term or clear your filters to see all users."
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
                      <th>User</th>
                      <th>Phone</th>
                      <th>Businesses</th>
                      <th>Access</th>
                      <th>Verification</th>
                      <th>Joined</th>
                      <th>Last updated</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => navigate(`/users/${user.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="table-user">
                            <Avatar name={user.name} size={38} />
                            <div className="table-user__meta">
                              <strong>
                                {user.name}
                                {user.id === currentUser?.id && (
                                  <span style={{ color: 'var(--muted)', fontWeight: 500 }}> (you)</span>
                                )}
                              </strong>
                              <span>{user.email ?? 'No email on file'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="nowrap">{user.phone ?? '—'}</td>
                        <td>{user.businessesCount}</td>
                        <td>
                          <AdminBadge role={user.role} />
                          {user.isAdmin && user.adminActivatedAt && (
                            <div style={{ fontSize: '0.69rem', color: 'var(--muted)', marginTop: 3 }}>
                              Activated
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="row wrap" style={{ gap: 4 }}>
                            <Badge tone={user.phoneVerifiedAt ? 'green' : 'gray'} dot>
                              Phone
                            </Badge>
                            <Badge tone={user.emailVerifiedAt ? 'green' : 'gray'} dot>
                              Email
                            </Badge>
                          </div>
                        </td>
                        <td className="nowrap">{formatDate(user.createdAt)}</td>
                        <td className="nowrap" style={{ color: 'var(--muted)' }}>
                          {formatDate(user.updatedAt)}
                        </td>
                        <td>
                          <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                            <Button
                              size="sm"
                              variant={user.isAdmin ? 'danger' : 'subtle'}
                              disabled={user.id === currentUser?.id || busyId === user.id}
                              onClick={() => void toggleAdmin(user)}
                            >
                              {user.isAdmin ? 'Revoke' : 'Grant admin'}
                            </Button>
                            <IconButton
                              icon="eye"
                              label="View user"
                              onClick={() => navigate(`/users/${user.id}`)}
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
              {paged.map((user) => (
                <div key={user.id} className="mobile-card">
                  <div className="mobile-card__top">
                    <div className="table-user">
                      <Avatar name={user.name} size={40} />
                      <div className="table-user__meta">
                        <strong>{user.name}</strong>
                        <span>{user.email ?? user.phone ?? 'No contact details'}</span>
                      </div>
                    </div>
                    <AdminBadge role={user.role} />
                  </div>
                  <div className="mobile-card__stats">
                    <span>
                      Businesses
                      <strong>{user.businessesCount}</strong>
                    </span>
                    <span>
                      Phone
                      <strong>{user.phone ?? '—'}</strong>
                    </span>
                    <span>
                      ID type
                      <strong>{user.idType ? titleCase(user.idType) : 'Not provided'}</strong>
                    </span>
                    <span>
                      Joined
                      <strong>{formatDate(user.createdAt)}</strong>
                    </span>
                  </div>
                  <div className="mobile-card__actions">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/users/${user.id}`)}>
                      View profile
                    </Button>
                    <Button
                      size="sm"
                      variant={user.isAdmin ? 'danger' : 'subtle'}
                      disabled={user.id === currentUser?.id || busyId === user.id}
                      onClick={() => void toggleAdmin(user)}
                    >
                      {user.isAdmin ? 'Revoke' : 'Grant admin'}
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
                totalLabel={`Showing ${rangeStart}–${rangeEnd} of ${filtered.length} users`}
              />
            </div>
          </>
        )}
      </Card>
    </>
  )
}
