import styled from 'styled-components'
import { colors } from '../../theme/colors'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

const MeterContainer = styled.div`
  margin-top: 0.5rem;
`

const StrengthBar = styled.div<{ strength: number }>`
  height: 6px;
  border-radius: 3px;
  background: ${colors.backgroundDark};
  overflow: hidden;
  margin-bottom: 0.5rem;

  .fill {
    height: 100%;
    transition: all 0.3s ease;
    width: ${props => props.strength * 25}%;
    background: ${props => {
      if (props.strength === 0) return colors.text.muted
      if (props.strength === 1) return colors.danger
      if (props.strength === 2) return '#ffa500' // orange
      if (props.strength === 3) return colors.success
      if (props.strength === 4) return colors.success
      return colors.text.muted
    }};
  }
`

const StrengthText = styled.div<{ strength: number }>`
  font-size: 0.85rem;
  color: ${props => {
    if (props.strength === 0) return colors.text.muted
    if (props.strength === 1) return colors.danger
    if (props.strength === 2) return '#ffa500'
    if (props.strength === 3) return colors.success
    if (props.strength === 4) return colors.success
    return colors.text.muted
  }};
  font-weight: 500;
`

const Requirements = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  font-size: 0.8rem;
  color: ${colors.text.secondary};

  li {
    padding: 0.15rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &.met {
      color: ${colors.success};

      i {
        color: ${colors.success};
      }
    }

    i {
      font-size: 0.7rem;
      width: 12px;
    }
  }
`

const commonPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  'password1', 'password123', 'admin', 'welcome', 'login'
]

interface PasswordChecks {
  length: boolean
  length12: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
  notCommon: boolean
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, className = '' }) => {
  const calculateStrength = (pwd: string): { strength: number, label: string, checks: PasswordChecks } => {
    if (!pwd) {
      return {
        strength: 0,
        label: '',
        checks: {
          length: false,
          length12: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
          notCommon: false
        }
      }
    }

    const checks = {
      length: pwd.length >= 8,
      length12: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~;]/.test(pwd),
      notCommon: !commonPasswords.includes(pwd.toLowerCase())
    }

    // Check if password is common
    if (!checks.notCommon) {
      return { strength: 1, label: 'Too Common', checks }
    }

    // Check length requirements
    if (pwd.length < 8) {
      return { strength: 1, label: 'Too Short', checks }
    }

    // If 12+ characters, automatically strong
    if (checks.length12) {
      return { strength: 4, label: 'Strong', checks }
    }

    // Between 8-11 characters - check complexity
    const complexityScore = [
      checks.uppercase,
      checks.lowercase,
      checks.number,
      checks.special
    ].filter(Boolean).length

    if (complexityScore === 4) {
      return { strength: 3, label: 'Good', checks }
    } else if (complexityScore >= 2) {
      return { strength: 2, label: 'Fair', checks }
    } else {
      return { strength: 1, label: 'Weak', checks }
    }
  }

  const { strength, label, checks } = calculateStrength(password)

  if (!password) {
    return null
  }

  return (
    <MeterContainer className={className}>
      <StrengthBar strength={strength}>
        <div className="fill" />
      </StrengthBar>

      <StrengthText strength={strength}>
        {strength > 0 && `Password Strength: ${label}`}
      </StrengthText>

      {password && strength < 3 && (
        <Requirements>
          <li className={checks.length12 ? 'met' : ''}>
            <i className={`bi ${checks.length12 ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
            12+ characters (recommended)
          </li>
          {!checks.length12 && (
            <>
              <li className={checks.length ? 'met' : ''}>
                <i className={`bi ${checks.length ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                At least 8 characters
              </li>
              <li className={checks.uppercase ? 'met' : ''}>
                <i className={`bi ${checks.uppercase ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                One uppercase letter
              </li>
              <li className={checks.lowercase ? 'met' : ''}>
                <i className={`bi ${checks.lowercase ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                One lowercase letter
              </li>
              <li className={checks.number ? 'met' : ''}>
                <i className={`bi ${checks.number ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                One number
              </li>
              <li className={checks.special ? 'met' : ''}>
                <i className={`bi ${checks.special ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                One special character (!@#$%...)
              </li>
            </>
          )}
          {!checks.notCommon && (
            <li style={{ color: colors.danger }}>
              <i className="bi bi-x-circle-fill"></i>
              Password is too common
            </li>
          )}
        </Requirements>
      )}
    </MeterContainer>
  )
}

export default PasswordStrengthMeter
