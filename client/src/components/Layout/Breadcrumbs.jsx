import { Link, useLocation } from 'react-router-dom';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (path) => {
    const names = {
      dashboard: 'Dashboard',
      products: 'Products',
      categories: 'Categories',
      warehouses: 'Warehouses',
      locations: 'Locations',
      documents: 'Documents',
      moves: 'Moves',
      'reorder-rules': 'Reorder Rules',
      profile: 'Profile',
      new: 'New',
    };
    return names[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 overflow-x-auto pb-1">
      <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <span key={routeTo} className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <span className="text-gray-400 dark:text-gray-500">/</span>
            {isLast ? (
              <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                {getBreadcrumbName(name)}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                {getBreadcrumbName(name)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

