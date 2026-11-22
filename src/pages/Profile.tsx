import { useState } from 'react'
import { useToast } from '../components/toast-context'
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
  Toggle,
} from '../components/ui'
import { businesses, currentAdmin, users } from '../data/mock'
import { formatDate } from '../lib/format'

export function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const toast = useToast()
  const { mode, setMode } = useTheme()
  const [profile, setProfile] = useState({
    name: currentAdmin.name,
    phone: currentAdmin.phone,
    email: currentAdmin.email,
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [twoFactor, setTwoFactor] = useState(true)
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    kycUpdates: true,
    newBusinesses: false,
    weeklyDigest: true,
  })

  function saveProfile() {
    if (!profile.name.trim()) {
      toast('Enter your name before saving.', 'error')
      return
    }
    toast('Profile updated.', 'success')
  }

  function updatePassword() {
    if (passwords.next.length < 8) {
      toast('New password must be at least 8 characters.', 'error')
      return
    }
    if (passwords.next !== passwords.confirm) {
      toast('Passwords do not match.', 'error')
      return
    }
    setPasswords({ current: '', next: '', confirm: '' })
    toast('Password updated.', 'success')
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
            <Avatar name={profile.name} size={82} ring />
          </div>
          <h2>{profile.name}</h2>
          <p className="profile-summary__email">{profile.email}</p>
          <div className="profile-summary__role">
            <Badge tone="purple" dot>
              {currentAdmin.role}
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
              {profile.phone}
            </div>
            <div>
              <Icon name="mail" size={15} />
              {profile.email}
            </div>
            <div>
              <Icon name="shield" size={15} />
              Admin since {formatDate(currentAdmin.adminSince)}
            </div>
            <div>
              <Icon name="clock" size={15} />
              Last active today, 08:42
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
            </div>
            <div className="row-between" style={{ marginTop: 18 }}>
              <p className="muted" style={{ fontSize: '0.76rem' }}>
                Your phone number is used to sign in to the console.
              </p>
              <Button onClick={saveProfile}>Save changes</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Security" subtitle="Protect access to the admin console" />
            <div className="setting-row">
              <div className="setting-row__text">
                <strong>
                  Two-factor authentication{' '}
                  <Badge tone={twoFactor ? 'green' : 'gray'}>{twoFactor ? 'Enabled' : 'Off'}</Badge>
                </strong>
                <span>Add an extra verification step when signing in from a new device.</span>
              </div>
              <Toggle
                checked={twoFactor}
                onChange={(value) => {
                  setTwoFactor(value)
                  toast(value ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.', 'info')
                }}
                label="Toggle two-factor authentication"
              />
            </div>
            <div className="section-divider" />
            <div className="form-grid">
              <Field label="Current password" htmlFor="current-password" className="field--full">
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                  placeholder="Enter current password"
                />
              </Field>
              <Field label="New password" htmlFor="profile-new-password">
                <Input
                  id="profile-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                  placeholder="At least 8 characters"
                />
              </Field>
              <Field label="Confirm new password" htmlFor="profile-confirm-password">
                <Input
                  id="profile-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                  placeholder="Re-enter new password"
                />
              </Field>
            </div>
            <div className="row-between" style={{ marginTop: 18 }}>
              <p className="muted" style={{ fontSize: '0.76rem' }}>
                Use a unique password you don&apos;t use elsewhere.
              </p>
              <Button variant="secondary" onClick={updatePassword}>
                Update password
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
              subtitle="Choose what lands in your inbox"
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
