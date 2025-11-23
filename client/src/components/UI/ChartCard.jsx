export const ChartCard = ({ title, children, className = '' }) => {
  return (
    <div className={`glass-card-hover p-4 sm:p-5 md:p-6 ${className} animate-fade-in`}>
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
        {title}
      </h3>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

