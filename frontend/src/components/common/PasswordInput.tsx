import React, { useState } from 'react'
import { Form, InputGroup, Button } from 'react-bootstrap'

// ============================================================================
// PasswordInput - Reusable password input with show/hide toggle
// ============================================================================

interface PasswordInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
  required?: boolean
  autoComplete?: string
  name?: string
  id?: string
  disabled?: boolean
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Enter password",
  label,
  required = false,
  autoComplete = "current-password",
  name,
  id,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label}</Form.Label>}
      <InputGroup>
        <Form.Control
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          name={name}
          id={id}
          disabled={disabled}
        />
        <Button
          variant="outline-secondary"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          type="button"
          disabled={disabled}
        >
          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </Button>
      </InputGroup>
    </Form.Group>
  )
}
