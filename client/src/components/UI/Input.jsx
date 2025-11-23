export const Input = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  className = '',
  rules,
  ...props
}) => {
  const inputClasses = `input-field ${error ? 'border-red-500' : ''} ${className}`;
  const registerProps = register ? register(name, rules) : {};

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="label">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          className={inputClasses}
          {...registerProps}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={inputClasses}
          {...registerProps}
          {...props}
        />
      )}
      {error && <p className="error-text">{error.message}</p>}
    </div>
  );
};

