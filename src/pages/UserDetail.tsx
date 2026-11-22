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
  ErrorState,
  Field,
  InfoItem,
  Input,
  LoadingState,
  Modal,
  Select,
} from '../components/ui'
import { useAuth } from '../components/auth-context'
import { useData } from '../components/data-context'
import { api, type IdentificationType } from '../lib/api'
import { fromIsoDate, mapUser, toIdentificationType, toIsoDate } from '../data/mappers'
import { formatDate, formatDateTime, titleCase } from '../lib/format'
import { navigate } from '../lib/router'

type UserForm = {
  name: string
  email: string
  phone: string
  idType: string
  identificationNumber: string
  dateOfBirth: string
}

function emptyForm(): UserForm {
  return {
    name: '',
    email: '',
    phone: '',
    idType: '',
    identificationNumber: '',
    dateOfBirth: '',
  }
}

export function UserDetailPage({ id }: { id: number }) {
  const toast = useToast()
  const { user: currentUser } = useAuth()
  const { users, loading, error, refresh, applyUser } = useData()
  const record = users.find((item) => item.id === id)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)

  function openEdit() {
    if (!record) return
    setForm({
      name: record.name,
      email: record.email ?? '',
      phone: record.phone ?? '',
      idType: record.idType ? (toIdentificationType(record.idType) ?? '') : '',
      identificationNumber: record.identificationNumber ?? '',
      dateOfBirth: fromIsoDate(record.dateOfBirth),
    })
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!record || !form.name.trim()) return
    setBusy(true)
    try {
      const response = await api.updateUser(record.id, {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone_number: form.phone.trim() || null,
        id_type: form.idType ? (toIdentificationType(form.idType) as IdentificationType) : null,
        identification_number: form.identificationNumber.trim() || null,
        date_of_birth: toIsoDate(form.dateOfBirth),
      })
      const updated = mapUser(response.data)
      applyUser(updated)
      setEditOpen(false)
      toast(response.message || 'User details updated.', 'success')
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update this user.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function toggleAdmin() {
    if (!record || record.id === currentUser?.id) return
    setBusy(true)
    try {
      const response = record.isAdmin
        ? await api.revokeAdmin(record.id)
        : await api.grantAdmin(record.id)
      applyUser(mapUser(response.data))
      setConfirmOpen(false)
      toast(
        response.message ||
          (record.isAdmin
            ? `Admin access revoked for ${record.name}.`
            : `Admin access granted to ${record.name}.`),
        record.isAdmin ? 'info' : 'success',
      )
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update admin access.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <Card><LoadingState label="Loading user" /></Card>
  }

  if (error) {
    return <Card><ErrorState message={error} onRetry={() => void refresh()} /></Card>
  }

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
  const isSelf = user.id === currentUser?.id

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
              <span>{user.phone ?? 'No phone on file'}</span>
              <span className="dot-sep" />
              <span>{user.idType ? titleCase(user.idType) : 'ID not provided'}</span>
            </div>
            <div className="profile-hero__badges">
              <AdminBadge role={user.role} />
              {user.phoneVerifiedAt && <Badge tone="green" dot>Phone verified</Badge>}
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
            disabled={isSelf || busy}
            onClick={() => setConfirmOpen(true)}
          >
            {user.isAdmin ? 'Revoke admin' : 'Grant admin'}
          </Button>
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <span>Businesses</span>
          <strong>{user.businessesCount}</strong>
          <small>Linked to this account</small>
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
          <span>Last updated</span>
          <strong>{formatDate(user.updatedAt)}</strong>
          <small>{formatDateTime(user.updatedAt).split(' · ')[1]}</small>
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
              <InfoItem label="Phone number">{user.phone ?? 'Not provided'}</InfoItem>
              <InfoItem label="Identification type">
                {user.idType ? titleCase(user.idType) : 'Not provided'}
              </InfoItem>
              <InfoItem label="Identification number">
                {user.identificationNumber ?? 'Not provided'}
              </InfoItem>
              <InfoItem label="Date of birth">{formatDate(user.dateOfBirth)}</InfoItem>
              <InfoItem label="Account created">{formatDateTime(user.createdAt)}</InfoItem>
              <InfoItem label="Last updated">{formatDateTime(user.updatedAt)}</InfoItem>
            </div>
            <div className="section-divider" />
            <div className="row wrap" style={{ gap: 8 }}>
              <Badge tone={user.email ? 'green' : 'gray'} dot>
                {user.email ? 'Email on file' : 'No email'}
              </Badge>
              <Badge tone={user.phoneVerifiedAt ? 'green' : 'gray'} dot>
                {user.phoneVerifiedAt ? 'Phone verified' : 'Phone unverified'}
              </Badge>
              <Badge tone={user.isAdmin ? 'purple' : 'gray'} dot>
                {user.isAdmin ? 'Admin account' : 'Customer account'}
              </Badge>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Business associations"
              subtitle="Business access from the user record"
              action={<Badge tone="gray">{user.businessesCount}</Badge>}
            />
            <div className="mini-stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <div className="mini-stat">
                <strong>{user.businessesCount}</strong>
                <span>Businesses linked</span>
              </div>
              <div className="mini-stat">
                <strong>{user.isAdmin ? 'Admin' : 'Standard'}</strong>
                <span>Account access</span>
              </div>
            </div>
            <div className="inline-alert inline-alert--info" style={{ marginTop: 12 }}>
              <Icon name="info" size={15} />
              <span>Open a business from the Businesses page to review owners and payment accounts.</span>
            </div>
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
              disabled={isSelf || busy}
              style={{ marginTop: 14 }}
              onClick={() => setConfirmOpen(true)}
            >
              {user.isAdmin ? 'Revoke admin access' : 'Grant admin access'}
            </Button>
          </Card>

          <Card>
            <CardHeader title="Account verification" subtitle="Identity checks on file" />
            <div className="checklist">
              <div className="checklist__item">
                <span
                  className="checklist__icon"
                  data-state={user.phoneVerifiedAt ? 'done' : 'pending'}
                >
                  <Icon name={user.phoneVerifiedAt ? 'check' : 'clock'} size={12} />
                </span>
                Phone number verified
              </div>
              <div className="checklist__item">
                <span
                  className="checklist__icon"
                  data-state={user.emailVerifiedAt ? 'done' : 'pending'}
                >
                  <Icon name={user.emailVerifiedAt ? 'check' : 'clock'} size={12} />
                </span>
                {user.emailVerifiedAt ? 'Email address verified' : 'Email address not verified'}
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
              <span className="account-line__label">Last updated</span>
              <span className="account-line__value">{formatDateTime(user.updatedAt)}</span>
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
            <Button onClick={() => void saveEdit()} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
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
              onChange={(event) => setForm({ ...form, idType: event.target.value })}
            >
              <option value="">Not provided</option>
              <option value="kenyan_national_id">Kenyan National ID</option>
              <option value="passport">Passport</option>
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
            <Button variant={user.isAdmin ? 'danger' : 'primary'} onClick={() => void toggleAdmin()} disabled={busy}>
              {user.isAdmin ? 'Revoke access' : 'Grant access'}
            </Button>
          </>
        }
      >
        <div className={user.isAdmin ? 'inline-alert' : 'inline-alert inline-alert--info'}>
          <Icon name={user.isAdmin ? 'alert' : 'info'} size={16} />
          <span>
            {user.isAdmin
              ? 'This action takes effect immediately. The user will lose console access.'
              : 'Admin access grants full visibility of businesses, KYC records and user management tools.'}
          </span>
        </div>
      </Modal>
    </>
  )
}
