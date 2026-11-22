import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { Icon, type IconName } from '../components/icons'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  InfoItem,
  Input,
  KycBadge,
  Modal,
  Select,
  StatusBadge,
  Tabs,
  type BadgeTone,
} from '../components/ui'
import { businessTypes, getBusiness, type BusinessStatus, type KycStatus } from '../data/mock'
import { formatDate, formatDateTime, formatKES } from '../lib/format'
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

function kycCheckState(status: KycStatus, key: string, verifiedPayment: boolean, hasLocation: boolean) {
  if (status === 'rejected') return 'missing'
  if (status === 'pending') return 'pending'
  if (status === 'unverified') return 'pending'
  if (key === 'payments' && !verifiedPayment) return 'pending'
  if (key === 'location' && !hasLocation) return 'missing'
  return 'done'
}

export function BusinessDetailPage({ id }: { id: number }) {
  const toast = useToast()
  const seed = getBusiness(id)
  const [record, setRecord] = useState(seed)
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name: seed?.name ?? '',
    type: seed?.businessType ?? businessTypes[0],
    category: seed?.businessCategory ?? '',
    registrationNumber: seed?.registrationNumber ?? '',
    phone: seed?.phone ?? '',
    email: seed?.email ?? '',
    county: seed?.county ?? '',
    town: seed?.town ?? '',
    ward: seed?.ward ?? '',
    address: seed?.physicalAddress ?? '',
  })

  if (!record) {
    return (
      <EmptyState
        icon="businesses"
        title="Business not found"
        description="This business may have been removed or the link is out of date."
        action={<Button onClick={() => navigate('/businesses')}>Back to businesses</Button>}
      />
    )
  }

  const business = record
  const verifiedPayment = business.paymentAccounts.some((account) => account.status === 'active')
  const primaryOwner = business.owners.find((owner) => owner.isPrimary) ?? business.owners[0]

  function openEdit() {
    setForm({
      name: business.name,
      type: business.businessType,
      category: business.businessCategory,
      registrationNumber: business.registrationNumber ?? '',
      phone: business.phone,
      email: business.email,
      county: business.county,
      town: business.town,
      ward: business.ward,
      address: business.physicalAddress ?? '',
    })
    setEditOpen(true)
  }

  function saveEdit() {
    setRecord({
      ...business,
      name: form.name,
      businessType: form.type,
      businessCategory: form.category,
      registrationNumber: form.registrationNumber || null,
      phone: form.phone,
      email: form.email,
      county: form.county,
      town: form.town,
      ward: form.ward,
      physicalAddress: form.address || null,
    })
    setEditOpen(false)
    toast('Business details updated.', 'success')
  }

  function setStatus(next: BusinessStatus) {
    if (next === business.status) return
    setRecord({ ...business, status: next })
    const label = statusCopy.find((option) => option.value === next)?.label ?? next
    toast(`Business status changed to ${label.toLowerCase()}.`, next === 'suspended' ? 'info' : 'success')
  }

  function setKyc(next: KycStatus) {
    setRecord({ ...business, kycStatus: next })
    toast(
      next === 'verified' ? 'KYC approved. The business can now transact.' : 'KYC marked as rejected.',
      next === 'verified' ? 'success' : 'info',
    )
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
      time: formatDateTime(business.createdAt),
    },
    {
      icon: 'creditCard',
      tone: 'blue',
      title: 'Payment account linked',
      description: business.paymentAccounts.length
        ? `${business.paymentAccounts[0].provider} ${business.paymentAccounts[0].channelType} ${business.paymentAccounts[0].accountReference} was attached to this business.`
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
                {business.town}, {business.county}
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
          <Button variant="secondary" iconLeft="edit" onClick={openEdit}>
            Edit details
          </Button>
          {business.kycStatus !== 'verified' ? (
            <Button variant="success" iconLeft="shield" onClick={() => setKyc('verified')}>
              Approve KYC
            </Button>
          ) : (
            <Button variant="secondary" iconLeft="shield" onClick={() => setKyc('pending')}>
              Re-open KYC
            </Button>
          )}
          {business.status === 'suspended' ? (
            <Button iconLeft="refresh" onClick={() => setStatus('active')}>
              Reactivate
            </Button>
          ) : (
            <Button variant="danger" iconLeft="ban" onClick={() => setStatus('suspended')}>
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
          <span>Monthly inflow</span>
          <strong>{formatKES(business.monthlyInflowMinor, { compact: true })}</strong>
          <small>Trailing 30 days</small>
        </div>
        <div className="quick-stat">
          <span>Outstanding advances</span>
          <strong>{formatKES(business.advancesOutstandingMinor, { compact: true })}</strong>
          <small>Across open advances</small>
        </div>
        <div className="quick-stat">
          <span>Owners & team</span>
          <strong>{business.owners.length}</strong>
          <small>{primaryOwner?.name ?? 'No primary contact'}</small>
        </div>
      </div>

      <div className="detail-tabs">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <span className="toolbar__meta">Updated {formatDate(business.createdAt)}</span>
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
                <InfoItem label="Registration number">
                  {business.registrationNumber ?? 'Not provided'}
                </InfoItem>
                <InfoItem label="Business type">{business.businessType}</InfoItem>
                <InfoItem label="Business category">{business.businessCategory}</InfoItem>
                <InfoItem label="Phone number">{business.phone}</InfoItem>
                <InfoItem label="Email address">{business.email}</InfoItem>
                <InfoItem label="County">{business.county}</InfoItem>
                <InfoItem label="Town / ward">
                  {business.town} · {business.ward}
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
                {business.owners.map((owner) => (
                  <div key={owner.id} className="team-row">
                    <Avatar name={owner.name} size={38} />
                    <div className="team-row__meta">
                      <strong>{owner.name}</strong>
                      <span>{owner.email}</span>
                    </div>
                    <Badge tone={owner.role === 'Owner' ? 'navy' : 'gray'}>{owner.role}</Badge>
                    {owner.isPrimary && <Badge tone="green">Primary</Badge>}
                  </div>
                ))}
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
                <span className="account-line__value">{business.paybillNumber ?? 'Not linked'}</span>
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
                  disabled={business.kycStatus === 'verified'}
                  onClick={() => setKyc('verified')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  iconLeft="close"
                  disabled={business.kycStatus === 'rejected'}
                  onClick={() => setKyc('rejected')}
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
                    className={`status-option${business.status === option.value ? ' status-option--active' : ''}`}
                    onClick={() => setStatus(option.value)}
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
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    iconLeft="userPlus"
                    onClick={() => toast('Member invitations are disabled in this design preview.', 'info')}
                  >
                    Invite member
                  </Button>
                }
              />
              <div className="team-list">
                {business.owners.map((owner) => (
                  <div key={owner.id} className="team-row">
                    <Avatar name={owner.name} size={42} />
                    <div className="team-row__meta">
                      <strong>{owner.name}</strong>
                      <span>
                        {owner.phone} · {owner.email}
                      </span>
                    </div>
                    <Badge tone={owner.role === 'Owner' ? 'navy' : 'gray'}>{owner.role}</Badge>
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
                        {primaryOwner.role} · {primaryOwner.status}
                      </p>
                    </div>
                  </div>
                  <div className="section-divider" />
                  <div className="account-line">
                    <span className="account-line__label">Phone</span>
                    <span className="account-line__value">{primaryOwner.phone}</span>
                  </div>
                  <div className="account-line">
                    <span className="account-line__label">Email</span>
                    <span className="account-line__value">{primaryOwner.email}</span>
                  </div>
                  <div className="account-line">
                    <span className="account-line__label">Business role</span>
                    <span className="account-line__value">{primaryOwner.role}</span>
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
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    iconLeft="plus"
                    onClick={() => toast('Adding payment accounts is disabled in this design preview.', 'info')}
                  >
                    Add account
                  </Button>
                }
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
                          {account.provider} {account.channelType} · {account.accountReference}
                        </strong>
                        <span>{account.accountName}</span>
                        <div className="payment-account__meta">
                          <Badge tone={paymentTone[account.status] ?? 'gray'} dot>
                            {account.status}
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
                <span className="account-line__value">{business.paybillNumber ?? 'Not linked'}</span>
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
            <Button onClick={saveEdit}>Save changes</Button>
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
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              {businessTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Business category" htmlFor="edit-category">
            <Input
              id="edit-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
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
          <Field label="County" htmlFor="edit-county">
            <Input
              id="edit-county"
              value={form.county}
              onChange={(event) => setForm({ ...form, county: event.target.value })}
            />
          </Field>
          <Field label="Town" htmlFor="edit-town">
            <Input
              id="edit-town"
              value={form.town}
              onChange={(event) => setForm({ ...form, town: event.target.value })}
            />
          </Field>
          <Field label="Ward" htmlFor="edit-ward">
            <Input
              id="edit-ward"
              value={form.ward}
              onChange={(event) => setForm({ ...form, ward: event.target.value })}
            />
          </Field>
          <Field label="Physical address" htmlFor="edit-address" className="field--full">
            <Input
              id="edit-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Street, building, shop number"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
