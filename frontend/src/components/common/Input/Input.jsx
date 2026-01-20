/**
 * Componente Input reutilizable
 */
const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange?.(name, e.target.value)}
        onBlur={onBlur ? () => onBlur(name) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="input-error-message">{error}</p>
      )}
    </div>
  )
}

export default Input
