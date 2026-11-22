import { useState } from 'react'
import { useToast } from '../components/toast-context'
import { useAuth } from '../components/auth-context'
import { useData } from '../components/data-context'
import { useTheme, type ThemeMode } from '../components/theme-context'
import { Icon } from '../components/icons'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
  Toggle,
} from '../components/ui'
import { api, type IdentificationType } from '../lib/api'
import { fromIsoDate, mapUser, toIdentificationType, toIsoDate } from '../data/mappers'
import { formatDate, formatDateTime } from '../lib/format'

export function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const toast = useToast()
  const { user, setUser } = useAuth()
  const { businesses, users, applyUser } = useData()
  const { mode, setMode } = useTheme()
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    idType: user?.idType ? (toIdentificationType(user.idType) ?? '') : '',
    identificationNumber: user?.identificationNumber ?? '',
    dateOfBirth: fromIsoDate(user?.dateOfBirth ?? null),
  })
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    kycUpdates: true,
    newBusinesses: false,
    weeklyDigest: true,
  })

  if (!user) return null
  const currentUser = user

  async function saveProfile() {
    if (!profile.name.trim()) {
      toast('Enter your name before saving.', 'error')
      return
    }

    setBusy(true)
    try {
      const response = await api.updateUser(currentUser.id, {
        name: profile.name.trim(),
        email: profile.email.trim() || null,
        phone_number: profile.phone.trim() || null,
        id_type: profile.idType ? (toIdentificationType(profile.idType) as IdentificationType) : null,
        identification_number: profile.identificationNumber.trim() || null,
        date_of_birth: toIsoDate(profile.dateOfBirth),
      })
      const updated = mapUser(response.data)
      applyUser(updated)
      setUser(updated)
      toast(response.message || 'Profile updated.', 'success')
    } catch (caught) {
      toast((caught as Error).message || 'Unable to update your profile.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Manage your administrator details, security and notification preferences."
        actions={
          <Button variant="secondary" iconLeft="logout" onClick={onLogout}>
            Sign out
          </Button>
        }
      />

      <div className="profile-layout">
        <Card className="profile-summary">
          <div className="profile-summary__avatar">
            <Avatar name={profile.name || user.name} size={82} ring />
          </div>
          <h2>{user.name}</h2>
          <p className="profile-summary__email">{user.email ?? 'No email on file'}</p>
          <div className="profile-summary__role">
            <Badge tone={user.isAdmin ? 'purple' : 'gray'} dot>
              {user.isAdmin ? 'Admin' : 'Customer'}
            </Badge>
          </div>
          <div className="profile-summary__stats">
            <div className="profile-summary__stat">
              <strong>{businesses.length}</strong>
              <span>Businesses</span>
            </div>
            <div className="profile-summary__stat">
              <strong>{users.length}</strong>
              <span>Users</span>
            </div>
          </div>
          <div className="profile-summary__meta">
            <div>
              <Icon name="phone" size={15} />
              {user.phone ?? 'No phone on file'}
            </div>
            <div>
              <Icon name="mail" size={15} />
              {user.email ?? 'No email on file'}
            </div>
            <div>
              <Icon name="shield" size={15} />
              Admin since {formatDate(user.adminActivatedAt)}
            </div>
            <div>
              <Icon name="clock" size={15} />
              Updated {formatDateTime(user.updatedAt)}
            </div>
          </div>
        </Card>

        <div className="detail-column">
          <Card>
            <CardHeader
              title="Personal information"
              subtitle="Your administrator contact details"
            />
            <div className="form-grid">
              <Field label="Full name" htmlFor="profile-name" className="field--full">
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
              </Field>
              <Field label="Phone number" htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </Field>
              <Field label="Email address" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                />
              </Field>
              <Field label="Date of birth" htmlFor="profile-dob">
                <Input
                  id="profile-dob"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })}
                />
              </Field>
              <Field label="Identification type" htmlFor="profile-id-type">
                <Select
                  id="profile-id-type"
                  value={profile.idType}
                  onChange={(event) => setProfile({ ...profile, idType: event.target.value })}
                >
                  <option value="">Not provided</option>
                  <option value="kenyan_national_id">Kenyan National ID</option>
                  <option value="passport">Passport</option>
                </Select>
              </Field>
              <Field label="Identification number" htmlFor="profile-id-number">
                <Input
                  id="profile-id-number"
                  value={profile.identificationNumber}
                  onChange={(event) =>
                    setProfile({ ...profile, identificationNumber: event.target.value })
                  }
                />
              </Field>
            </div>
            <div className="row-between" style={{ marginTop: 18 }}>
              <p className="muted" style={{ fontSize: '0.76rem' }}>
                Your phone number is used to sign in to the console.
              </p>
              <Button onClick={() => void saveProfile()} disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Security" subtitle="Protect access to the admin console" />
            <div className="inline-alert inline-alert--info">
              <Icon name="info" size={16} />
              <span>
                Password and two-factor settings are managed through the QCash identity flow. Use
                sign out to end this console session.
              </span>
            </div>
            <div className="section-divider" />
            <div className="row-between">
              <div>
                <p className="text-strong" style={{ fontSize: '0.83rem' }}>
                  Current session
                </p>
                <p className="muted" style={{ fontSize: '0.75rem' }}>
                  Signed in as {user.name}
                </p>
              </div>
              <Button variant="danger" iconLeft="logout" onClick={onLogout}>
                Sign out
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Appearance"
              subtitle="Choose how the console looks on this device"
            />
            <div className="setting-row setting-row--appearance">
              <div className="setting-row__text">
                <strong>Theme</strong>
                <span>
                  Dark mode is easier on the eyes in low-light environments. System follows your
                  device preference.
                </span>
              </div>
              <Segmented
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
                value={mode}
                onChange={(value) => {
                  const nextMode = value as ThemeMode
                  setMode(nextMode)
                  toast(
                    nextMode === 'system'
                      ? 'Theme now follows your device setting.'
                      : `${nextMode === 'dark' ? 'Dark' : 'Light'} mode enabled.`,
                    'info',
                  )
                }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Notification preferences"
              subtitle="Local preferences for this device"
            />
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>Email alerts</strong>
                <span>Security alerts and important account notices.</span>
              </div>
              <Toggle
                checked={prefs.emailAlerts}
                onChange={(value) => setPrefs({ ...prefs, emailAlerts: value })}
                label="Toggle email alerts"
              />
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>KYC queue updates</strong>
                <span>Get notified when businesses submit or resubmit documents.</span>
              </div>
              <Toggle
                checked={prefs.kycUpdates}
                onChange={(value) => setPrefs({ ...prefs, kycUpdates: value })}
                label="Toggle KYC queue updates"
              />
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>New business registrations</strong>
                <span>An email each time a business completes onboarding.</span>
              </div>
              <Toggle
                checked={prefs.newBusinesses}
                onChange={(value) => setPrefs({ ...prefs, newBusinesses: value })}
                label="Toggle new business notifications"
              />
            </div>
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>Weekly digest</strong>
                <span>A Monday summary of platform activity and compliance items.</span>
              </div>
              <Toggle
                checked={prefs.weeklyDigest}
                onChange={(value) => setPrefs({ ...prefs, weeklyDigest: value })}
                label="Toggle weekly digest"
              />
            </div>
          </Card>

          <Card className="danger-zone">
            <CardHeader
              title="Sign out of console"
              subtitle="End your session on this device."
            />
            <div className="row-between">
              <p className="muted" style={{ fontSize: '0.78rem' }}>
                You will need your phone number and password to sign back in.
              </p>
              <Button variant="danger" iconLeft="logout" onClick={onLogout}>
                Sign out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
