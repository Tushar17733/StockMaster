export const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg sm:rounded-xl">
          <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

export const TableHeader = ({ children }) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800/50">
      <tr>{children}</tr>
    </thead>
  );
};

export const TableHeaderCell = ({ children, className = '' }) => {
  return (
    <th
      className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
};

export const TableBody = ({ children }) => {
  return <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
};

export const TableRow = ({ children, onClick, className = '' }) => {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = '' }) => {
  return <td className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 ${className}`}>{children}</td>;
};

