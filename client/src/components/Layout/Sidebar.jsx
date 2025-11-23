import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/categories', label: 'Categories', icon: '🏷️' },
  { path: '/warehouses', label: 'Warehouses', icon: '🏭' },
  { path: '/locations', label: 'Locations', icon: '📍' },
  { path: '/documents', label: 'Documents', icon: '📄' },
  { path: '/moves', label: 'Moves', icon: '🔄' },
  { path: '/reorder-rules', label: 'Reorder Rules', icon: '📋' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 glass-card border-r border-white/20 dark:border-gray-700/30 z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto lg:w-64 lg:flex-shrink-0 relative overflow-hidden`}
      >
        {/* Background image layer */}
        <div 
          className="absolute inset-0 z-0 opacity-20 dark:opacity-15 transition-opacity duration-300"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Background overlay for better readability */}
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-0" />
        
        <div className="flex flex-col h-full relative z-10">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 bg-clip-text text-transparent">
              StockMaster
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                location.pathname.startsWith(item.path + '/');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`group flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 relative text-sm sm:text-base ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-violet-500/20 dark:from-primary-400/30 dark:to-violet-400/30 text-primary-700 dark:text-primary-300 font-semibold shadow-lg shadow-primary-500/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className={`text-lg sm:text-xl transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 sm:h-8 bg-gradient-to-b from-primary-500 to-violet-500 rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-2 sm:p-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <Link
              to="/profile"
              className={`group flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                location.pathname === '/profile' ? 'bg-primary-500/10 dark:bg-primary-400/20' : ''
              }`}
            >
              <span className="text-lg sm:text-xl transition-transform duration-200 group-hover:scale-110">👤</span>
              <span className="truncate">Profile</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

