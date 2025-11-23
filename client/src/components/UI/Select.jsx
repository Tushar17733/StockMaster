export const Select = ({
  label,
  name,
  register,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  rules,
  ...props
}) => {
  const registerProps = register ? register(name, rules) : {};

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
        {...registerProps}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="error-text">{error.message}</p>}
    </div>
  );
};

