import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../components/toast-context'
import { Icon, type IconName } from '../components/icons'
import {
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
  KycBadge,
  LoadingState,
  Modal,
  Select,
  StatusBadge,
  Tabs,
  Toggle,
  type BadgeTone,
} from '../components/ui'
import { useData } from '../components/data-context'
import { api, type BusinessStatus, type KycStatus, type SubCountyResource, type WardResource } from '../lib/api'
import { mapBusinessDetail } from '../data/mappers'
import type { Business } from '../data/types'
import { formatDate, formatDateTime, formatKES, titleCase } from '../lib/format'
import { navigate } from '../lib/router'

const statusCopy: Array<{ value: BusinessStatus; label: string; hint: string }> = [
  { value: 'active', label: 'Active', hint: 'Business can transact and access revenue.' },
  { value: 'pending', label: 'Pending', hint: 'Onboarding is still under review.' },
  { value: 'suspended', label: 'Suspended', hint: 'Temporarily blocked from transacting.' },
  { value: 'closed', label: 'Closed', hint: 'Account is permanently closed.' },
]

const paymentTone: Record<string, BadgeTone> = {
  active: 'green',
  pending: 'amber',
  inactive: 'gray',
}

type BusinessForm = {
  name: string
  businessTypeId: string
  hasPhysicalLocation: boolean
  countyId: string
  subCountyId: string
  wardId: string
  address: string
  phone: string
  email: string
  registrationNumber: string
}

function emptyForm(): BusinessForm {
  return {
    name: '',
    businessTypeId: '',
    hasPhysicalLocation: false,
    countyId: '',
    subCountyId: '',
    wardId: '',
    address: '',
    phone: '',
    email: '',
    registrationNumber: '',
  }
}

function formFromBusiness(business: Business): BusinessForm {
  return {
    name: business.name,
    businessTypeId: business.businessTypeId ? String(business.businessTypeId) : '',
    hasPhysicalLocation: business.hasPhysicalLocation,
    countyId: business.countyId ? String(business.countyId) : '',
    subCountyId: business.subCountyId ? String(business.subCountyId) : '',
    wardId: business.wardId ? String(business.wardId) : '',
    address: business.physicalAddress ?? '',
    phone: business.phone ?? '',
    email: business.email ?? '',
    registrationNumber: business.registrationNumber ?? '',
  }
}

function kycCheckState(status: KycStatus, key: string, verifiedPayment: boolean, hasLocation: boolean) {
  if (status === 'rejected') return 'missing'
  if (status === 'pending' || status === 'unverified') return 'pending'
  if (key === 'payments' && !verifiedPayment) return 'pending'
  if (key === 'location' && !hasLocation) return 'missing'
  return 'done'
}

export function BusinessDetailPage({ id }: { id: number }) {
  const toast = useToast()
  const { businessTypes, counties, applyBusiness } = useData()
  const [record, setRecord] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState<BusinessForm>(emptyForm)
  const [subCounties, setSubCounties] = useState<SubCountyResource[]>([])
  const [wards, setWards] = useState<WardResource[]>([])

  const loadBusiness = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getBusiness(id)
      const business = mapBusinessDetail(response.data)
      setRecord(business)
      setForm(formFromBusiness(business))
    } catch (caught) {
      setError((caught as Error).message || 'Unable to load this business.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => void loadBusiness())
  }, [loadBusiness])

  useEffect(() => {
    if (!form.countyId) {
      Promise.resolve().then(() => setSubCounties([]))
      return
    }
    let active = true
    api
      .listSubCounties(Number(form.countyId))
      .then((response) => {
        if (active) setSubCounties(response.data)
      })
      .catch(() => {
        if (active) setSubCounties([])
      })
    return () => {
      active = false
    }
  }, [form.countyId])

  useEffect(() => {
    if (!form.subCountyId) {
      Promise.resolve().then(() => setWards([]))
      return
    }
    let active = true
    api
      .listWards(Number(form.subCountyId))
      .then((response) => {
        if (active) setWards(response.data)
      })
      .catch(() => {
        if (active) setWards([])
      })
    return () => {
      active = false
    }
  }, [form.subCountyId])

  if (loading) {
    return <Card><LoadingState label="Loading business" /></Card>
  }

  if (error || !record) {
    return (
      <Card>
        <ErrorState
          message={error ?? 'Business not found.'}
          onRetry={() => void loadBusiness()}
        />
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 20 }}>
          <Button variant="secondary" onClick={() => navigate('/businesses')}>
            Back to businesses
          </Button>
        </div>
      </Card>
    )
  }

  const business = record
  const verifiedPayment = business.paymentAccounts.some((account) => account.status === 'active')
  const primaryOwner = business.owners.find((owner) => owner.isPrimary) ?? business.owners[0]

  function openEdit() {
    setForm(formFromBusiness(business))
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!form.name.trim() || !form.businessTypeId) return
    setBusy(true)
    try {
      const response = await api.updateBusiness(id, {
        business_name: form.name.trim(),
        business_type_id: Number(form.businessTypeId),
        has_physical_location: form.hasPhysicalLocation,
        county_id: form.hasPhysicalLocation && form.countyId ? Number(form.countyId) : null,
        sub_county_id: form.hasPhysicalLocation && form.subCountyId ? Number(form.subCountyId) : null,
        ward_id: form.hasPhysicalLocation && form.wardId ? Number(form.wardId) : null,
        physical_address: form.hasPhysicalLocation ? form.address || null : null,
        phone_number: form.phone.trim() || null,
        email: form.email.trim() || null,
        registration_number: form.registrationNumber.trim() || null,
      })
      const updated = mapBusinessDetail(response.data)
      setRecord(updated)
      applyBusiness(updated)
      setEditOpen(false)
      toast(response.message || 'Business details updated.', 'success')
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update this business.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(next: BusinessStatus) {
    if (next === business.status) return
    setBusy(true)
    try {
      const response = await api.updateBusinessStatus(id, { status: next })
      const updated = mapBusinessDetail(response.data)
      setRecord(updated)
      applyBusiness(updated)
      const label = statusCopy.find((option) => option.value === next)?.label ?? next
      toast(response.message || `Business status changed to ${label.toLowerCase()}.`, 'success')
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update business status.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function setKyc(next: KycStatus) {
    if (next === business.kycStatus) return
    setBusy(true)
    try {
      const response = await api.updateBusinessKycStatus(id, { kyc_status: next })
      const updated = mapBusinessDetail(response.data)
      setRecord(updated)
      applyBusiness(updated)
      toast(
        response.message ||
          (next === 'verified' ? 'KYC approved. The business can now transact.' : 'KYC status updated.'),
        next === 'verified' ? 'success' : 'info',
      )
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update KYC status.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const events: Array<{ icon: IconName; tone: string; title: string; description: string; time: string }> = [
    {
      icon: 'shield',
      tone: business.kycStatus === 'verified' ? 'green' : business.kycStatus === 'rejected' ? 'red' : 'amber',
      title: `KYC ${business.kycStatus}`,
      description:
        business.kycStatus === 'verified'
          ? 'Compliance team approved the submitted business documents.'
          : business.kycStatus === 'rejected'
            ? 'Submitted documents did not meet verification requirements.'
            : 'Documents are queued for compliance review.',
      time: formatDateTime(business.updatedAt ?? business.createdAt),
    },
    {
      icon: 'creditCard',
      tone: 'blue',
      title: 'Payment account linked',
      description: business.paymentAccounts.length
        ? `${business.paymentAccounts[0].provider} ${titleCase(business.paymentAccounts[0].channelType)} ${business.paymentAccounts[0].accountReference ?? ''} was attached to this business.`
        : 'No payment account has been linked yet.',
      time: formatDateTime(business.createdAt),
    },
    {
      icon: 'businesses',
      tone: 'purple',
      title: 'Business registered',
      description: `${primaryOwner?.name ?? 'The owner'} registered the business on QCash.`,
      time: formatDateTime(business.createdAt),
    },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Owners & team', count: business.owners.length },
    { id: 'payments', label: 'Payment accounts', count: business.paymentAccounts.length },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <>
      <button type="button" className="detail-back" onClick={() => navigate('/businesses')}>
        <Icon name="arrowLeft" size={15} />
        All businesses
      </button>

      <div className="card profile-hero">
        <div className="profile-hero__left">
          <Avatar name={business.name} size={64} ring />
          <div className="profile-hero__body">
            <h1>{business.name}</h1>
            <div className="profile-hero__meta">
              <span>{business.publicId}</span>
              <span className="dot-sep" />
              <span>{business.businessType}</span>
              <span className="dot-sep" />
              <span>
                {business.town ?? business.ward ?? 'Location not set'}, {business.county ?? '—'}
              </span>
            </div>
            <div className="profile-hero__badges">
              <StatusBadge status={business.status} />
              <KycBadge status={business.kycStatus} />
              {business.hasPhysicalLocation ? (
                <Badge tone="navy">Physical location</Badge>
              ) : (
                <Badge tone="gray">Online business</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="profile-hero__actions">
          <Button variant="secondary" iconLeft="edit" onClick={openEdit} disabled={busy}>
            Edit details
          </Button>
          {business.kycStatus !== 'verified' ? (
            <Button variant="success" iconLeft="shield" disabled={busy} onClick={() => void setKyc('verified')}>
              Approve KYC
            </Button>
          ) : (
            <Button variant="secondary" iconLeft="shield" disabled={busy} onClick={() => void setKyc('pending')}>
              Re-open KYC
            </Button>
          )}
          {business.status === 'suspended' ? (
            <Button iconLeft="refresh" disabled={busy} onClick={() => void setStatus('active')}>
              Reactivate
            </Button>
          ) : (
            <Button variant="danger" iconLeft="ban" disabled={busy} onClick={() => void setStatus('suspended')}>
              Suspend
            </Button>
          )}
        </div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat">
          <span>Wallet balance</span>
          <strong>{formatKES(business.walletBalanceMinor, { compact: true })}</strong>
          <small>Held by QCash</small>
        </div>
        <div className="quick-stat">
          <span>Collection account</span>
          <strong>{business.collectionAccount ?? 'Not linked'}</strong>
          <small>Receives business payments</small>
        </div>
        <div className="quick-stat">
          <span>Paybill number</span>
          <strong>{business.paybillNumber || 'Not linked'}</strong>
          <small>QCash payment channel</small>
        </div>
        <div className="quick-stat">
          <span>Owners & team</span>
          <strong>{business.owners.length}</strong>
          <small>{primaryOwner?.name ?? 'No primary contact'}</small>
        </div>
      </div>

      <div className="detail-tabs">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <span className="toolbar__meta">Updated {formatDate(business.updatedAt ?? business.createdAt)}</span>
      </div>

      {tab === 'overview' && (
        <div className="detail-grid">
          <div className="detail-column">
            <Card>
              <CardHeader
                title="Business information"
                subtitle="Registered details and contact information"
                action={
                  <Button size="sm" variant="ghost" iconLeft="edit" onClick={openEdit}>
                    Edit
                  </Button>
                }
              />
              <div className="details-grid">
                <InfoItem label="Business name">{business.name}</InfoItem>
                <InfoItem label="Registration number">{business.registrationNumber ?? 'Not provided'}</InfoItem>
                <InfoItem label="Business type">{business.businessType}</InfoItem>
                <InfoItem label="Business category">{business.businessCategory ?? 'Not provided'}</InfoItem>
                <InfoItem label="Phone number">{business.phone ?? 'Not provided'}</InfoItem>
                <InfoItem label="Email address">{business.email ?? 'Not provided'}</InfoItem>
                <InfoItem label="County">{business.county ?? 'Not provided'}</InfoItem>
                <InfoItem label="Town / ward">
                  {business.town ?? '—'} · {business.ward ?? '—'}
                </InfoItem>
                <InfoItem label="Operating since">{formatDate(business.operatingSince)}</InfoItem>
                <InfoItem label="Joined QCash">{formatDate(business.createdAt)}</InfoItem>
                <InfoItem label="Physical address" full>
                  {business.physicalAddress ?? 'No physical address on file'}
                </InfoItem>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Owners & team"
                subtitle="People with access to this business account"
                action={
                  <Button size="sm" variant="ghost" iconRight="arrowRight" onClick={() => setTab('team')}>
                    View all
                  </Button>
                }
              />
              <div className="team-list">
                {business.owners.length ? (
                  business.owners.map((owner) => (
                    <div key={owner.id} className="team-row">
                      <Avatar name={owner.name} size={38} />
                      <div className="team-row__meta">
                        <strong>{owner.name}</strong>
                        <span>{owner.email ?? owner.phone ?? 'No contact details'}</span>
                      </div>
                      <Badge tone={owner.role.toLowerCase() === 'owner' ? 'navy' : 'gray'}>{titleCase(owner.role)}</Badge>
                      {owner.isPrimary && <Badge tone="green">Primary</Badge>}
                    </div>
                  ))
                ) : (
                  <p className="muted">No team members were returned for this business.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="detail-column">
            <Card>
              <CardHeader title="Wallet & payments" subtitle="Collection accounts linked to this business" />
              <div className="wallet-panel">
                <span className="wallet-panel__label">Available wallet balance</span>
                <div className="wallet-panel__value">{formatKES(business.walletBalanceMinor)}</div>
                <div className="wallet-panel__meta">
                  <span>Held by QCash for settlement</span>
                  <strong>{business.paymentAccounts.length} linked</strong>
                </div>
              </div>
              <div className="account-line">
                <span className="account-line__label">Collection account</span>
                <span className="account-line__value">{business.collectionAccount ?? 'Not linked'}</span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Paybill number</span>
                <span className="account-line__value">{business.paybillNumber || 'Not linked'}</span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Payment provider</span>
                <span className="account-line__value">
                  {business.paymentAccounts[0]?.provider ?? 'None'}
                </span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Verification</span>
                <span className="account-line__value">
                  {verifiedPayment ? 'Verified' : 'Pending'}
                </span>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="KYC verification"
                subtitle="Compliance checks for this business"
                action={<KycBadge status={business.kycStatus} />}
              />
              <div className="checklist">
                <div className="checklist__item">
                  <span
                    className="checklist__icon"
                    data-state={kycCheckState(business.kycStatus, 'identity', verifiedPayment, business.hasPhysicalLocation)}
                  >
                    <Icon
                      name={business.kycStatus === 'verified' ? 'check' : business.kycStatus === 'rejected' ? 'close' : 'clock'}
                      size={12}
                    />
                  </span>
                  Identity & owner details
                </div>
                <div className="checklist__item">
                  <span
                    className="checklist__icon"
                    data-state={kycCheckState(business.kycStatus, 'documents', verifiedPayment, business.hasPhysicalLocation)}
                  >
                    <Icon
                      name={business.kycStatus === 'verified' ? 'check' : business.kycStatus === 'rejected' ? 'close' : 'clock'}
                      size={12}
                    />
                  </span>
                  Business registration documents
                </div>
                <div className="checklist__item">
                  <span
                    className="checklist__icon"
                    data-state={kycCheckState(business.kycStatus, 'payments', verifiedPayment, business.hasPhysicalLocation)}
                  >
                    <Icon name={verifiedPayment ? 'check' : 'clock'} size={12} />
                  </span>
                  M-Pesa account ownership
                </div>
                <div className="checklist__item">
                  <span
                    className="checklist__icon"
                    data-state={kycCheckState(business.kycStatus, 'location', verifiedPayment, business.hasPhysicalLocation)}
                  >
                    <Icon name={business.hasPhysicalLocation ? 'check' : 'close'} size={12} />
                  </span>
                  Physical location confirmation
                </div>
              </div>
              {business.kycStatus === 'verified' ? (
                <div className="inline-alert inline-alert--green" style={{ marginTop: 16 }}>
                  <Icon name="checkCircle" size={15} />
                  <span>This business is KYC verified and eligible to access revenue.</span>
                </div>
              ) : (
                <div className="inline-alert" style={{ marginTop: 16 }}>
                  <Icon name="alert" size={15} />
                  <span>Review the submitted documents before approving this business.</span>
                </div>
              )}
              <div className="kyc-actions">
                <Button
                  size="sm"
                  variant="success"
                  iconLeft="check"
                  disabled={busy || business.kycStatus === 'verified'}
                  onClick={() => void setKyc('verified')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  iconLeft="close"
                  disabled={busy || business.kycStatus === 'rejected'}
                  onClick={() => void setKyc('rejected')}
                >
                  Reject
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Account status" subtitle="Control whether this business can transact" />
              <div className="status-controls">
                {statusCopy.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={busy}
                    className={`status-option${business.status === option.value ? ' status-option--active' : ''}`}
                    onClick={() => void setStatus(option.value)}
                  >
                    <span className="status-option__radio" />
                    <span>
                      {option.label}
                      <span className="status-option__hint">{option.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="detail-grid">
          <div className="detail-column">
            <Card>
              <CardHeader
                title="Owners & team"
                subtitle="People attached to this business account"
              />
              {business.owners.length ? (
                <div className="team-list">
                  {business.owners.map((owner) => (
                    <div key={owner.id} className="team-row">
                      <Avatar name={owner.name} size={42} />
                      <div className="team-row__meta">
                        <strong>{owner.name}</strong>
                        <span>
                          {owner.phone ?? 'No phone'} · {owner.email ?? 'No email'}
                        </span>
                      </div>
                      <Badge tone={owner.role.toLowerCase() === 'owner' ? 'navy' : 'gray'}>{titleCase(owner.role)}</Badge>
                      {owner.isPrimary && <Badge tone="green">Primary contact</Badge>}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/users/${owner.userId}`)}
                      >
                        View user
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="users"
                  title="No team members"
                  description="No owners or team members were returned for this business."
                />
              )}
            </Card>
          </div>
          <div className="detail-column">
            <Card>
              <CardHeader title="Primary contact" subtitle="Main point of contact for compliance" />
              {primaryOwner ? (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <Avatar name={primaryOwner.name} size={48} />
                    <div>
                      <p className="text-strong">{primaryOwner.name}</p>
                      <p className="muted" style={{ fontSize: '0.78rem' }}>
                        {titleCase(primaryOwner.role)} · {primaryOwner.status}
                      </p>
                    </div>
                  </div>
                  <div className="section-divider" />
                  <div className="account-line">
                    <span className="account-line__label">Phone</span>
                    <span className="account-line__value">{primaryOwner.phone ?? 'Not provided'}</span>
                  </div>
                  <div className="account-line">
                    <span className="account-line__label">Email</span>
                    <span className="account-line__value">{primaryOwner.email ?? 'Not provided'}</span>
                  </div>
                  <div className="account-line">
                    <span className="account-line__label">Business role</span>
                    <span className="account-line__value">{titleCase(primaryOwner.role)}</span>
                  </div>
                  <Button
                    variant="secondary"
                    full
                    iconLeft="user"
                    style={{ marginTop: 16 }}
                    onClick={() => navigate(`/users/${primaryOwner.userId}`)}
                  >
                    Open user profile
                  </Button>
                </>
              ) : (
                <p className="muted">No primary contact has been assigned.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="detail-grid">
          <div className="detail-column">
            <Card>
              <CardHeader
                title="Payment accounts"
                subtitle="Payment channels linked to this business"
              />
              {business.paymentAccounts.length ? (
                <div className="payment-accounts">
                  {business.paymentAccounts.map((account) => (
                    <div key={account.id} className="payment-account">
                      <span className="payment-account__icon">
                        <Icon name="creditCard" size={19} />
                      </span>
                      <div className="payment-account__body">
                        <strong>
                          {account.provider} {titleCase(account.channelType)} · {account.accountReference ?? '—'}
                        </strong>
                        <span>{account.accountName ?? 'No account name on file'}</span>
                        <div className="payment-account__meta">
                          <Badge tone={paymentTone[account.status] ?? 'gray'} dot>
                            {titleCase(account.status)}
                          </Badge>
                          <span>
                            {account.verifiedAt
                              ? `Verified ${formatDate(account.verifiedAt)}`
                              : 'Verification pending'}
                          </span>
                        </div>
                      </div>
                      <Icon name="chevronRight" size={16} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="creditCard"
                  title="No payment accounts"
                  description="This business has not linked a paybill or till number yet."
                />
              )}
            </Card>
          </div>
          <div className="detail-column">
            <Card>
              <CardHeader title="Collection settings" subtitle="How QCash receives business payments" />
              <div className="account-line">
                <span className="account-line__label">Collection account</span>
                <span className="account-line__value">{business.collectionAccount ?? 'Not linked'}</span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Paybill number</span>
                <span className="account-line__value">{business.paybillNumber || 'Not linked'}</span>
              </div>
              <div className="account-line">
                <span className="account-line__label">Settlement wallet</span>
                <span className="account-line__value">
                  {formatKES(business.walletBalanceMinor, { compact: true })}
                </span>
              </div>
              <div className="inline-alert inline-alert--info" style={{ marginTop: 16 }}>
                <Icon name="info" size={15} />
                <span>
                  Payment details are managed by the business owner. Admins can review but not edit
                  collection accounts.
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity timeline" subtitle="Account events for this business" />
          <div className="activity-list">
            {events.map((event) => (
              <div key={event.title + event.time} className="activity-item">
                <span className="activity-item__dot" data-tone={event.tone}>
                  <Icon name={event.icon} size={15} />
                </span>
                <div className="activity-item__body">
                  <p>
                    <strong>{event.title}</strong>
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2 }}>
                    {event.description}
                  </p>
                  <span>{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit business details"
        subtitle="Update the registered information for this business."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy || !form.businessTypeId}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Business name" htmlFor="edit-name" className="field--full">
            <Input
              id="edit-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Business type" htmlFor="edit-type">
            <Select
              id="edit-type"
              value={form.businessTypeId}
              onChange={(event) => setForm({ ...form, businessTypeId: event.target.value })}
            >
              <option value="">Select business type</option>
              {businessTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Registration number" htmlFor="edit-registration">
            <Input
              id="edit-registration"
              value={form.registrationNumber}
              onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })}
              placeholder="Optional"
            />
          </Field>
          <Field label="Phone number" htmlFor="edit-phone">
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="Email address" htmlFor="edit-email" className="field--full">
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Has physical location" htmlFor="edit-physical">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 6 }}>
              <Toggle
                checked={form.hasPhysicalLocation}
                onChange={(checked) =>
                  setForm({
                    ...form,
                    hasPhysicalLocation: checked,
                    countyId: checked ? form.countyId : '',
                    subCountyId: checked ? form.subCountyId : '',
                    wardId: checked ? form.wardId : '',
                    address: checked ? form.address : '',
                  })
                }
                label="Has physical location"
              />
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                {form.hasPhysicalLocation ? 'Location details required' : 'Online business'}
              </span>
            </div>
          </Field>
          <Field label="County" htmlFor="edit-county">
            <Select
              id="edit-county"
              value={form.countyId}
              disabled={!form.hasPhysicalLocation}
              onChange={(event) =>
                setForm({ ...form, countyId: event.target.value, subCountyId: '', wardId: '' })
              }
            >
              <option value="">Select county</option>
              {counties.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sub-county" htmlFor="edit-subcounty">
            <Select
              id="edit-subcounty"
              value={form.subCountyId}
              disabled={!form.hasPhysicalLocation || !form.countyId}
              onChange={(event) => setForm({ ...form, subCountyId: event.target.value, wardId: '' })}
            >
              <option value="">Select sub-county</option>
              {subCounties.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ward" htmlFor="edit-ward">
            <Select
              id="edit-ward"
              value={form.wardId}
              disabled={!form.hasPhysicalLocation || !form.subCountyId}
              onChange={(event) => setForm({ ...form, wardId: event.target.value })}
            >
              <option value="">Select ward</option>
              {wards.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Physical address" htmlFor="edit-address" className="field--full">
            <Input
              id="edit-address"
              value={form.address}
              disabled={!form.hasPhysicalLocation}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Street, building, shop number"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
