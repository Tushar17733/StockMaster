import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getInitials } from '../../utils/helpers';

export const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="glass-card border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-30 backdrop-blur-xl">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 p-1 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-none">
                  {user?.role?.replace('_', ' ') || ''}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 text-white flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow duration-200">
                {getInitials(user?.name || 'U')}
              </div>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 sm:w-48 glass-card rounded-lg sm:rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 py-2 animate-scale-in z-50">
                <div className="px-3 sm:px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

