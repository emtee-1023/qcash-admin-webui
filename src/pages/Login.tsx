import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../components/icons'
import { Button, Field, Input, Logo } from '../components/ui'
import { useTheme } from '../components/theme-context'
import { ThemeToggle } from '../components/theme-toggle'
import { useAuth } from '../components/auth-context'
import { useToast } from '../components/toast-context'
import { navigate } from '../lib/router'

export function LoginPage() {
  const { theme } = useTheme()
  const { signIn } = useAuth()
  const toast = useToast()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!phone.trim()) nextErrors.phone = 'Enter the phone number linked to your admin account.'
    if (!password.trim()) nextErrors.password = 'Enter your password.'
    if (password.length > 0 && password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      await signIn(phone.trim(), password, remember)
      navigate('/overview')
      toast('Signed in to the admin console.', 'success')
    } catch (caught) {
      setErrors({ form: (caught as Error).message || 'Unable to sign in. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth__brand">
        <span className="auth__orb auth__orb--one" />
        <span className="auth__orb auth__orb--two" />
        <div className="auth__brand-inner">
          <div className="auth__brand-logo">
            <Logo variant="navy" height={38} />
          </div>
          <div className="auth__brand-copy">
            <span className="auth__brand-eyebrow">
              <Icon name="sparkle" size={13} />
              Admin console
            </span>
            <h1>Oversee every business on QCash, in one place.</h1>
            <p className="auth__brand-sub">
              Review onboarding, verify KYC and keep the QCash network of Kenyan MSMEs moving —
              all from a single, secure command centre.
            </p>
            <div className="auth__features">
              <div className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon name="businesses" size={18} />
                </span>
                <div>
                  <strong>Business oversight</strong>
                  <span>Approve businesses, manage status and review payment accounts.</span>
                </div>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <strong>KYC verification</strong>
                  <span>Keep compliance tight with a clear verification workflow.</span>
                </div>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon name="users" size={18} />
                </span>
                <div>
                  <strong>User management</strong>
                  <span>Update profiles, control access and grant admin privileges.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="auth__brand-footer">
            <span>© 2026 QCash. Built for MSME finance.</span>
            <span className="auth__trust">
              <Icon name="lock" size={13} />
              Bank-grade security
            </span>
          </div>
        </div>
      </aside>

      <main className="auth__panel">
        <ThemeToggle className="auth__theme" />
        <div className="auth__card">
          <div className="auth__mobile-brand">
            <Logo variant={theme === 'dark' ? 'navy' : 'light'} height={34} />
          </div>
          <div className="auth__heading">
            <span className="eyebrow">Administrator access</span>
            <h1>Welcome back</h1>
            <p>Sign in with the phone number linked to your QCash admin account.</p>
          </div>

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <Field label="Phone number" htmlFor="admin-phone" error={errors.phone}>
              <div className="input-icon">
                <Icon name="phone" size={17} />
                <Input
                  id="admin-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="admin-password" error={errors.password}>
              <div className="input-icon">
                <Icon name="lock" size={17} />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="input-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
            </Field>

            <div className="auth__row">
              <label className="auth__checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Remember this device
              </label>
              <button type="button" className="auth__link" onClick={() => navigate('/activate')}>
                First time? Activate
              </button>
            </div>

            {errors.form && (
              <p className="auth__hint" style={{ color: 'var(--red-text)' }}>
                {errors.form}
              </p>
            )}

            <Button type="submit" size="lg" full className="auth__submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in to console'}
            </Button>
          </form>

          <div className="auth__divider">New administrator</div>
          <p className="auth__note">
            Received an activation code?{' '}
            <button type="button" onClick={() => navigate('/activate')}>
              Activate your admin account
            </button>
          </p>

          <div className="auth__footer">
            <Icon name="shield" size={13} />
            Protected by QCash identity and access controls
          </div>
        </div>
      </main>
    </div>
  )
}
