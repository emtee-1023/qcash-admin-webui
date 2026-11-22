import { useRef, useState } from 'react'
import { useToast } from '../components/toast-context'
import type { FormEvent } from 'react'
import { Icon } from '../components/icons'
import { Button, Field, Input, Logo } from '../components/ui'
import { useTheme } from '../components/theme-context'
import { ThemeToggle } from '../components/theme-toggle'
import { api } from '../lib/api'
import { navigate } from '../lib/router'

function OtpInput({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  function setDigit(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, '')
    const next = [...value]
    if (!digits) {
      next[index] = ''
      onChange(next)
      return
    }
    digits.split('').forEach((digit, offset) => {
      if (index + offset < next.length) next[index + offset] = digit
    })
    onChange(next)
    const focusTo = Math.min(value.length - 1, index + digits.length)
    refs.current[focusTo]?.focus()
  }

  return (
    <div className="otp-row" role="group" aria-label="One-time passcode">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          className="otp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={digit}
          aria-label={`Digit ${index + 1} of 6`}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digit && index > 0) {
              refs.current[index - 1]?.focus()
            }
            if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
            if (event.key === 'ArrowRight' && index < value.length - 1) refs.current[index + 1]?.focus()
          }}
        />
      ))}
    </div>
  )
}

export function ActivatePage() {
  const toast = useToast()
  const { theme } = useTheme()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; otp?: string; password?: string; confirm?: string }>({})

  async function resendCode() {
    if (!phone.trim()) {
      setErrors((current) => ({ ...current, phone: 'Enter your phone number first.' }))
      return
    }
    setBusy(true)
    try {
      const response = await api.resendActivationOtp({ phone_number: phone.trim() })
      toast(response.message, 'info')
    } catch (caught) {
      toast((caught as Error).message || 'Unable to resend the code.', 'error')
    } finally {
      setBusy(false)
    }
  }

  function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!phone.trim()) nextErrors.phone = 'Enter the phone number linked to your invitation.'
    if (otp.join('').length !== 6) nextErrors.otp = 'Enter the full 6-digit activation code.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setStep(2)
  }

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (confirm !== password) nextErrors.confirm = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    setFormError('')
    try {
      const response = await api.activate({
        phone_number: phone.trim(),
        otp: otp.join(''),
        password,
        password_confirmation: confirm,
      })
      toast(response.message, 'success')
      navigate('/login')
    } catch (caught) {
      setFormError((caught as Error).message || 'Unable to activate the account.')
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
              <Icon name="key" size={13} />
              Account activation
            </span>
            <h1>One last step before you take the reins.</h1>
            <p className="auth__brand-sub">
              Admin invitations are verified by SMS. Confirm your activation code and set a
              secure password to access the QCash admin console.
            </p>
            <div className="auth__features">
              <div className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <strong>Verified by phone</strong>
                  <span>The activation code is sent only to the invited administrator.</span>
                </div>
              </div>
              <div className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon name="key" size={18} />
                </span>
                <div>
                  <strong>You set the password</strong>
                  <span>Choose a strong password that only you know.</span>
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

          <div className="auth-steps">
            <span className={step === 1 ? 'auth-step auth-step--active' : 'auth-step auth-step--done'}>
              <span className="auth-step__num">{step === 1 ? '1' : <Icon name="check" size={13} />}</span>
              Verify code
            </span>
            <span className="auth-step__line" />
            <span className={step === 2 ? 'auth-step auth-step--active' : 'auth-step'}>
              <span className="auth-step__num">2</span>
              Set password
            </span>
          </div>

          {step === 1 ? (
            <>
              <div className="auth__heading">
                <span className="eyebrow">Step 1 of 2</span>
                <h1>Verify it&apos;s you</h1>
                <p>
                  Enter the 6-digit activation code sent to the phone number linked to your admin
                  invitation.
                </p>
              </div>

              <form className="auth__form" onSubmit={verifyCode} noValidate>
                <Field label="Phone number" htmlFor="activate-phone" error={errors.phone}>
                  <div className="input-icon">
                    <Icon name="phone" size={17} />
                    <Input
                      id="activate-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>
                </Field>

                <Field label="Activation code" error={errors.otp}>
                  <OtpInput value={otp} onChange={setOtp} />
                </Field>

                <div className="otp-meta">
                  <span>Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    className="auth__link"
                    disabled={busy}
                    onClick={() => void resendCode()}
                  >
                    Resend code
                  </button>
                </div>

                <Button type="submit" size="lg" full disabled={busy}>
                  {busy ? 'Please wait…' : 'Verify code'}
                </Button>

                <button type="button" className="auth__link" onClick={() => navigate('/login')}>
                  ← Back to sign in
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth__heading">
                <span className="eyebrow">Step 2 of 2</span>
                <h1>Create your password</h1>
                <p>Set a password you&apos;ll use to access the QCash admin console.</p>
              </div>

              <div className="activate-summary">
                <span className="activate-summary__icon">
                  <Icon name="checkCircle" size={19} />
                </span>
                <div>
                  <strong>Phone verified</strong>
                  <span>{phone}</span>
                </div>
              </div>

              <form className="auth__form" onSubmit={activate} noValidate>
                <Field
                  label="New password"
                  htmlFor="new-password"
                  hint="At least 8 characters."
                  error={errors.password}
                >
                  <div className="input-icon">
                    <Icon name="lock" size={17} />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
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

                <Field
                  label="Confirm password"
                  htmlFor="confirm-password"
                  error={errors.confirm}
                >
                  <div className="input-icon">
                    <Icon name="lock" size={17} />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                    />
                  </div>
                </Field>

                {formError && (
                  <p className="auth__hint" style={{ color: 'var(--red-text)' }}>
                    {formError}
                  </p>
                )}

                <Button type="submit" size="lg" full disabled={busy}>
                  {busy ? 'Activating…' : 'Activate account'}
                </Button>

                <button type="button" className="auth__link" onClick={() => setStep(1)}>
                  ← Use a different code
                </button>
              </form>
            </>
          )}

          <p className="auth__hint">
            One-time codes are delivered by SMS. Contact platform support if your invitation code
            does not arrive.
          </p>

          <div className="auth__footer">
            <Icon name="help" size={13} />
            Need help? Contact platform support at support@qcash.co.ke
          </div>
        </div>
      </main>
    </div>
  )
}
