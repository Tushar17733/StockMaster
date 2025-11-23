export const Loader = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin`}
      />
    </div>
  );
};

export const SkeletonLoader = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="lg" />
    </div>
  );
};

