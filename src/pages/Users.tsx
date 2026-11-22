import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { AdminBadge, Avatar, Badge, Button, Card, EmptyState, IconButton, PageHeader, Pagination, SearchField, Segmented, Select } from '../components/ui'
import { currentAdmin, users as seedUsers } from '../data/mock'
import { formatDate, formatDateTime } from '../lib/format'
import { navigate } from '../lib/router'

const pageSize = 8

export function UsersPage() {
  const toast = useToast()
  const [rows, setRows] = useState(seedUsers)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const admins = rows.filter((user) => user.isAdmin).length

  const filtered = rows.filter((user) => {
    const search = query.trim().toLowerCase()
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search) ||
      (user.email ?? '').toLowerCase().includes(search) ||
      user.phone.toLowerCase().includes(search) ||
      user.identificationNumber.toLowerCase().includes(search)
    const matchesRole =
      role === 'all' || (role === 'admins' ? user.isAdmin : !user.isAdmin)
    const matchesStatus = status === 'all' || user.status === status
    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(filtered.length, safePage * pageSize)
  const filtersActive = query !== '' || role !== 'all' || status !== 'all'

  function resetFilters() {
    setQuery('')
    setRole('all')
    setStatus('all')
    setPage(1)
  }

  function toggleAdmin(id: number) {
    const user = rows.find((item) => item.id === id)
    if (!user) return
    if (id === currentAdmin.id && user.isAdmin) {
      toast('You cannot revoke your own admin access.', 'error')
      return
    }
    const nextAdmin = !user.isAdmin
    setRows((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              isAdmin: nextAdmin,
              role: nextAdmin ? 'Admin' : 'Customer',
              adminActivatedAt: nextAdmin ? new Date().toISOString() : null,
            }
          : item,
      ),
    )
    toast(
      nextAdmin
        ? `Admin access granted to ${user.name}.`
        : `Admin access revoked for ${user.name}.`,
      nextAdmin ? 'success' : 'info',
    )
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
              onClick={() => toast('User export queued (design preview).', 'info')}
            >
              Export
            </Button>
            <Button iconLeft="shield" onClick={() => { setRole('admins'); setPage(1) }}>
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
        <div className="toolbar__select">
          <Select
            aria-label="Filter by account status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
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
        {filtered.length === 0 ? (
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
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last active</th>
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
                                {user.id === currentAdmin.id && (
                                  <span style={{ color: 'var(--muted)', fontWeight: 500 }}> (you)</span>
                                )}
                              </strong>
                              <span>{user.email ?? 'No email on file'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="nowrap">{user.phone}</td>
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
                          <Badge tone={user.status === 'active' ? 'green' : 'red'} dot>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="nowrap">{formatDate(user.createdAt)}</td>
                        <td className="nowrap" style={{ color: 'var(--muted)' }}>
                          {formatDateTime(user.lastActiveAt).split(' · ')[0]}
                        </td>
                        <td>
                          <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                            <Button
                              size="sm"
                              variant={user.isAdmin ? 'danger' : 'subtle'}
                              disabled={user.id === currentAdmin.id}
                              onClick={() => toggleAdmin(user.id)}
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
                        <span>{user.email ?? user.phone}</span>
                      </div>
                    </div>
                    <Badge tone={user.status === 'active' ? 'green' : 'red'} dot>
                      {user.status}
                    </Badge>
                  </div>
                  <div className="mobile-card__stats">
                    <span>
                      Access
                      <AdminBadge role={user.role} />
                    </span>
                    <span>
                      Businesses
                      <strong>{user.businessesCount}</strong>
                    </span>
                    <span>
                      Phone
                      <strong>{user.phone}</strong>
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
                      disabled={user.id === currentAdmin.id}
                      onClick={() => toggleAdmin(user.id)}
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
