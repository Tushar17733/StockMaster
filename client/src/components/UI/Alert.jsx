export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const darkTypes = {
    success: 'dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    error: 'dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    warning: 'dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    info: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  };

  return (
    <div className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 text-sm sm:text-base ${types[type]} ${darkTypes[type]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex-1 break-words">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 sm:ml-4 text-current opacity-70 hover:opacity-100 flex-shrink-0 p-1"
            aria-label="Close alert"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

