import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { Icon } from '../components/icons'
import {
  AdminBadge,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  InfoItem,
  Input,
  Modal,
  Select,
  StatusBadge,
} from '../components/ui'
import { businesses, currentAdmin, getUser } from '../data/mock'
import { formatDate, formatDateTime } from '../lib/format'
import { navigate } from '../lib/router'

export function UserDetailPage({ id }: { id: number }) {
  const toast = useToast()
  const seed = getUser(id)
  const [record, setRecord] = useState(seed)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState({
    name: seed?.name ?? '',
    email: seed?.email ?? '',
    phone: seed?.phone ?? '',
    idType: seed?.idType ?? 'Kenyan National ID',
    identificationNumber: seed?.identificationNumber ?? '',
    dateOfBirth: seed?.dateOfBirth ?? '',
  })

  if (!record) {
    return (
      <EmptyState
        icon="users"
        title="User not found"
        description="This account may have been removed or the link is out of date."
        action={<Button onClick={() => navigate('/users')}>Back to users</Button>}
      />
    )
  }

  const user = record
  const isSelf = user.id === currentAdmin.id
  const ownedBusinesses = businesses.filter((business) =>
    business.owners.some((owner) => owner.userId === user.id),
  )

  function openEdit() {
    setForm({
      name: user.name,
      email: user.email ?? '',
      phone: user.phone,
      idType: user.idType,
      identificationNumber: user.identificationNumber,
      dateOfBirth: user.dateOfBirth,
    })
    setEditOpen(true)
  }

  function saveEdit() {
    setRecord({
      ...user,
      name: form.name,
      email: form.email || null,
      phone: form.phone,
      idType: form.idType as typeof user.idType,
      identificationNumber: form.identificationNumber,
      dateOfBirth: form.dateOfBirth,
    })
    setEditOpen(false)
    toast('User details updated.', 'success')
  }

  function toggleAdmin() {
    const next = !user.isAdmin
    setRecord({
      ...user,
      isAdmin: next,
      role: next ? 'Admin' : 'Customer',
      adminActivatedAt: next ? new Date().toISOString() : null,
    })
    setConfirmOpen(false)
    toast(
      next ? `Admin access granted to ${user.name}.` : `Admin access revoked for ${user.name}.`,
      next ? 'success' : 'info',
    )
  }

  return (
    <>
      <button type="button" className="detail-back" onClick={() => navigate('/users')}>
        <Icon name="arrowLeft" size={15} />
        All users
      </button>

      <div className="card profile-hero">
        <div className="profile-hero__left">
          <Avatar name={user.name} size={64} ring />
          <div className="profile-hero__body">
            <h1>
              {user.name}
              {isSelf && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.9rem' }}> (you)</span>}
            </h1>
            <div className="profile-hero__meta">
              <span>{user.email ?? 'No email on file'}</span>
              <span className="dot-sep" />
              <span>{user.phone}</span>
              <span className="dot-sep" />
              <span>{user.idType}</span>
            </div>
            <div className="profile-hero__badges">
              <AdminBadge role={user.role} />
              <Badge tone={user.status === 'active' ? 'green' : 'red'} dot>
                {user.status}
              </Badge>
              {user.isAdmin && user.adminActivatedAt && <Badge tone="navy">Admin activated</Badge>}
            </div>
          </div>
        </div>
        <div className="profile-hero__actions">
          <Button variant="secondary" iconLeft="edit" onClick={openEdit}>
            Edit user
          </Button>
          <Button
            variant={user.isAdmin ? 'danger' : 'primary'}
            iconLeft="shield"
            disabled={isSelf}
            onClick={() => setConfirmOpen(true)}
          >
            {user.isAdmin ? 'Revoke admin' : 'Grant admin'}
          </Button>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <span>Businesses</span>
          <strong>{ownedBusinesses.length}</strong>
          <small>Owned or co-managed</small>
        </div>
        <div className="quick-stat">
          <span>Access level</span>
          <strong>{user.isAdmin ? 'Administrator' : 'Customer'}</strong>
          <small>{user.isAdmin ? 'Console access' : 'QCash app only'}</small>
        </div>
        <div className="quick-stat">
          <span>Joined QCash</span>
          <strong>{formatDate(user.createdAt)}</strong>
          <small>{formatDateTime(user.createdAt).split(' · ')[1]}</small>
        </div>
        <div className="quick-stat">
          <span>Last active</span>
          <strong>{formatDate(user.lastActiveAt)}</strong>
          <small>{formatDateTime(user.lastActiveAt).split(' · ')[1]}</small>
        </div>
      </div>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <div className="detail-column">
          <Card>
            <CardHeader
              title="Personal information"
              subtitle="Identity and contact details for this account"
              action={
                <Button size="sm" variant="ghost" iconLeft="edit" onClick={openEdit}>
                  Edit
                </Button>
              }
            />
            <div className="details-grid">
              <InfoItem label="Full name">{user.name}</InfoItem>
              <InfoItem label="Email address">{user.email ?? 'Not provided'}</InfoItem>
              <InfoItem label="Phone number">{user.phone}</InfoItem>
              <InfoItem label="Identification type">{user.idType}</InfoItem>
              <InfoItem label="Identification number">{user.identificationNumber}</InfoItem>
              <InfoItem label="Date of birth">{formatDate(user.dateOfBirth)}</InfoItem>
              <InfoItem label="Account created">{formatDateTime(user.createdAt)}</InfoItem>
              <InfoItem label="Last active">{formatDateTime(user.lastActiveAt)}</InfoItem>
            </div>
            <div className="section-divider" />
            <div className="row wrap" style={{ gap: 8 }}>
              <Badge tone={user.email ? 'green' : 'gray'} dot>
                {user.email ? 'Email on file' : 'No email'}
              </Badge>
              <Badge tone="green" dot>
                Phone verified
              </Badge>
              <Badge tone={user.isAdmin ? 'purple' : 'gray'} dot>
                {user.isAdmin ? 'Admin account' : 'Customer account'}
              </Badge>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Businesses"
              subtitle="Businesses this user is attached to"
              action={
                <Badge tone="gray">{ownedBusinesses.length}</Badge>
              }
            />
            {ownedBusinesses.length ? (
              <div className="team-list">
                {ownedBusinesses.map((business) => (
                  <div key={business.id} className="team-row">
                    <Avatar name={business.name} size={40} />
                    <div className="team-row__meta">
                      <strong>{business.name}</strong>
                      <span>
                        {business.businessType} · {business.town}, {business.county}
                      </span>
                    </div>
                    <StatusBadge status={business.status} />
                    <Button
                      size="sm"
                      variant="ghost"
                      iconRight="arrowRight"
                      onClick={() => navigate(`/businesses/${business.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="businesses"
                title="No businesses yet"
                description="This user has not registered or joined a business on QCash."
              />
            )}
          </Card>
        </div>

        <div className="detail-column">
          <Card>
            <CardHeader
              title="Admin access"
              subtitle="Console permissions for this account"
              action={<AdminBadge role={user.role} />}
            />
            <div className="row" style={{ gap: 12, marginBottom: 4 }}>
              <span className="icon-chip" data-tone={user.isAdmin ? 'purple' : 'navy'}>
                <Icon name="shield" size={20} />
              </span>
              <div>
                <p className="text-strong">{user.isAdmin ? 'Administrator' : 'Customer'}</p>
                <p className="muted" style={{ fontSize: '0.76rem' }}>
                  {user.isAdmin
                    ? 'Can review businesses, KYC and manage users.'
                    : 'Uses the QCash customer app only.'}
                </p>
              </div>
            </div>
            <div className="section-divider" />
            <div className="account-line">
              <span className="account-line__label">Access level</span>
              <span className="account-line__value">{user.isAdmin ? 'Admin' : 'Standard'}</span>
            </div>
            <div className="account-line">
              <span className="account-line__label">Activated at</span>
              <span className="account-line__value">
                {user.adminActivatedAt ? formatDateTime(user.adminActivatedAt) : 'Not activated'}
              </span>
            </div>
            <div className="account-line">
              <span className="account-line__label">Account status</span>
              <span className="account-line__value">{user.status}</span>
            </div>
            {isSelf ? (
              <div className="inline-alert inline-alert--info" style={{ marginTop: 16 }}>
                <Icon name="info" size={15} />
                <span>You cannot revoke your own admin access.</span>
              </div>
            ) : (
              <div className="inline-alert" style={{ marginTop: 16 }}>
                <Icon name="alert" size={15} />
                <span>
                  {user.isAdmin
                    ? 'Revoking access immediately removes console permissions.'
                    : 'Only grant admin access to trusted platform operators.'}
                </span>
              </div>
            )}
            <Button
              variant={user.isAdmin ? 'danger' : 'primary'}
              full
              iconLeft="shield"
              disabled={isSelf}
              style={{ marginTop: 14 }}
              onClick={() => setConfirmOpen(true)}
            >
              {user.isAdmin ? 'Revoke admin access' : 'Grant admin access'}
            </Button>
          </Card>

          <Card>
            <CardHeader title="Account security" subtitle="Verification and session details" />
            <div className="checklist">
              <div className="checklist__item">
                <span className="checklist__icon">
                  <Icon name="check" size={12} />
                </span>
                Phone number verified
              </div>
              <div className="checklist__item">
                <span
                  className="checklist__icon"
                  data-state={user.email ? 'done' : 'pending'}
                >
                  <Icon name={user.email ? 'check' : 'clock'} size={12} />
                </span>
                {user.email ? 'Email address on file' : 'Email address missing'}
              </div>
              <div className="checklist__item">
                <span
                  className="checklist__icon"
                  data-state={user.isAdmin && user.adminActivatedAt ? 'done' : 'pending'}
                >
                  <Icon name={user.isAdmin && user.adminActivatedAt ? 'check' : 'clock'} size={12} />
                </span>
                Admin activation
              </div>
            </div>
            <div className="section-divider" />
            <div className="account-line">
              <span className="account-line__label">Last active</span>
              <span className="account-line__value">{formatDateTime(user.lastActiveAt)}</span>
            </div>
            <div className="account-line">
              <span className="account-line__label">Date of birth</span>
              <span className="account-line__value">{formatDate(user.dateOfBirth)}</span>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit user"
        subtitle="Update this user's personal information."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Full name" htmlFor="user-name" className="field--full">
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Email address" htmlFor="user-email" className="field--full">
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Phone number" htmlFor="user-phone">
            <Input
              id="user-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="Date of birth" htmlFor="user-dob">
            <Input
              id="user-dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
            />
          </Field>
          <Field label="Identification type" htmlFor="user-id-type">
            <Select
              id="user-id-type"
              value={form.idType}
              onChange={(event) => setForm({ ...form, idType: event.target.value as typeof form.idType })}
            >
              <option value="Kenyan National ID">Kenyan National ID</option>
              <option value="Passport">Passport</option>
            </Select>
          </Field>
          <Field label="Identification number" htmlFor="user-id-number">
            <Input
              id="user-id-number"
              value={form.identificationNumber}
              onChange={(event) => setForm({ ...form, identificationNumber: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={user.isAdmin ? 'Revoke admin access?' : 'Grant admin access?'}
        subtitle={
          user.isAdmin
            ? `${user.name} will lose access to the QCash admin console.`
            : `${user.name} will be able to access the QCash admin console.`
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant={user.isAdmin ? 'danger' : 'primary'} onClick={toggleAdmin}>
              {user.isAdmin ? 'Revoke access' : 'Grant access'}
            </Button>
          </>
        }
      >
        <div className={user.isAdmin ? 'inline-alert' : 'inline-alert inline-alert--info'}>
          <Icon name={user.isAdmin ? 'alert' : 'info'} size={16} />
          <span>
            {user.isAdmin
              ? 'This action takes effect immediately. The user will be signed out of any active admin sessions.'
              : 'Admin access grants full visibility of businesses, KYC records and user management tools.'}
          </span>
        </div>
      </Modal>
    </>
  )
}
