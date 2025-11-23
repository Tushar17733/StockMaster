import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden lg:flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="absolute inset-0 flex flex-col h-full w-full overflow-hidden lg:relative lg:flex-1 lg:inset-auto" style={{ zIndex: 10 }}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <Breadcrumbs />
            <div className="mt-3 sm:mt-4 md:mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

