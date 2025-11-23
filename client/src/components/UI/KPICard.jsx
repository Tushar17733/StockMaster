import { useEffect, useState } from 'react';

export const KPICard = ({ title, value, icon, color = 'primary', trend, trendValue, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      animateValue(0, value, 1000);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const animateValue = (start, end, duration) => {
    const startTime = performance.now();
    const isNumber = typeof end === 'number';

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      if (isNumber) {
        setDisplayValue(Math.floor(start + (end - start) * easeOutQuart));
      } else {
        setDisplayValue(end);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  };

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500',
    electric: 'from-electric-500 to-electric-600 dark:from-electric-400 dark:to-electric-500',
    teal: 'from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500',
    violet: 'from-violet-500 to-violet-600 dark:from-violet-400 dark:to-violet-500',
  };

  const glowClasses = {
    primary: 'shadow-glow-blue',
    electric: 'shadow-glow-teal',
    teal: 'shadow-glow-teal',
    violet: 'shadow-glow-violet',
  };

  return (
    <div
      className={`kpi-card group animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
            </p>
            {trend && trendValue && (
              <div className={`mt-1 sm:mt-2 flex items-center text-xs sm:text-sm font-medium ${
                trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                <span className="mr-1">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
                <span className="truncate">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[color]} ${glowClasses[color]} transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
            <span className="text-xl sm:text-2xl md:text-3xl">{icon}</span>
          </div>
        </div>
      </div>
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
    </div>
  );
};

