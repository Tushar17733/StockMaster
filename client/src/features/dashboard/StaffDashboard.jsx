import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { dashboardAPI } from '../../api/dashboard';
import { documentsAPI } from '../../api/documents';
import { KPICard } from '../../components/UI/KPICard';
import { ChartCard } from '../../components/UI/ChartCard';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  primary: '#6366f1',
  electric: '#06b6d4',
  teal: '#14b8a6',
  violet: '#8b5cf6',
};

const DARK_COLORS = {
  primary: '#818cf8',
  electric: '#22d3ee',
  teal: '#2dd4bf',
  violet: '#a78bfa',
};

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [chartData, setChartData] = useState([]);

  const { data: summaryData, loading: summaryLoading, error: summaryError } = useApi(
    () => dashboardAPI.getSummary(),
    true
  );

  const { data: documentsData, loading: documentsLoading } = useApi(
    () => documentsAPI.getAll({ limit: 50 }),
    true
  );

  useEffect(() => {
    if (summaryData?.data) {
      setSummary(summaryData.data);
    }
  }, [summaryData]);

  useEffect(() => {
    if (documentsData?.data) {
      const pending = documentsData.data
        .filter(doc => ['DRAFT', 'WAITING', 'READY'].includes(doc.status))
        .slice(0, 5);
      setPendingTasks(pending);
    }
  }, [documentsData]);

  useEffect(() => {
    if (documentsData?.data) {
      const docs = documentsData.data;
      const statusCounts = docs.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});

      setChartData([
        { name: 'Draft', value: statusCounts.DRAFT || 0 },
        { name: 'Waiting', value: statusCounts.WAITING || 0 },
        { name: 'Ready', value: statusCounts.READY || 0 },
        { name: 'Done', value: statusCounts.DONE || 0 },
        { name: 'Canceled', value: statusCounts.CANCELED || 0 },
      ]);
    }
  }, [documentsData]);

  const loading = summaryLoading || documentsLoading;
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? DARK_COLORS : COLORS;

  // Weekly activity data (mock for now)
  const weeklyActivity = [
    { day: 'Mon', receipts: 12, deliveries: 8 },
    { day: 'Tue', receipts: 15, deliveries: 10 },
    { day: 'Wed', receipts: 10, deliveries: 12 },
    { day: 'Thu', receipts: 18, deliveries: 9 },
    { day: 'Fri', receipts: 14, deliveries: 11 },
    { day: 'Sat', receipts: 8, deliveries: 6 },
    { day: 'Sun', receipts: 5, deliveries: 4 },
  ];

  // Document type distribution
  const documentTypes = [
    { name: 'Receipts', value: summary?.pending_receipts_count || 0 },
    { name: 'Deliveries', value: summary?.pending_deliveries_count || 0 },
    { name: 'Transfers', value: summary?.internal_transfers_scheduled_count || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" />
      </div>
    );
  }

  if (summaryError) {
    return <Alert type="error" message="Failed to load dashboard data" />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Welcome Header - Staff Style: Energetic bounce-in animation */}
      <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 animate-bounce-in">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-electric-600 to-teal-600 dark:from-teal-400 dark:via-electric-400 dark:to-teal-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto] break-words">
              Welcome, {user?.name}!
            </h1>
            <p className="mt-1 sm:mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg">
              Here's your daily tasks and warehouse overview
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-teal-500/30 to-electric-500/30 backdrop-blur-sm flex items-center justify-center animate-float">
              <span className="text-2xl md:text-3xl">⚡</span>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-electric-500/30 to-violet-500/30 backdrop-blur-sm flex items-center justify-center animate-float-delayed">
              <span className="text-2xl md:text-3xl">🚀</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Staff Style: Bounce-in with staggered delays */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-bounce-in" style={{ animationDelay: '0ms' }}>
          <KPICard
            title="Pending Receipts"
            value={summary?.pending_receipts_count || 0}
            icon="📥"
            color="teal"
            delay={0}
          />
        </div>
        <div className="animate-bounce-in" style={{ animationDelay: '100ms' }}>
          <KPICard
            title="Pending Deliveries"
            value={summary?.pending_deliveries_count || 0}
            icon="📤"
            color="electric"
            delay={100}
          />
        </div>
        <div className="animate-bounce-in" style={{ animationDelay: '200ms' }}>
          <KPICard
            title="Internal Transfers"
            value={summary?.internal_transfers_scheduled_count || 0}
            icon="🔄"
            color="violet"
            delay={200}
          />
        </div>
        <div className="animate-bounce-in" style={{ animationDelay: '300ms' }}>
          <KPICard
            title="Products in Stock"
            value={summary?.total_products_in_stock || 0}
            icon="📦"
            color="primary"
            delay={300}
          />
        </div>
      </div>

      {/* Charts Row - Staff Style: Slide-right and zoom-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Weekly Activity Chart */}
        <div className="animate-slide-right" style={{ animationDelay: '400ms' }}>
          <ChartCard title="Weekly Activity">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="receipts" 
                  fill={colors.teal} 
                  name="Receipts" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                />
                <Bar 
                  dataKey="deliveries" 
                  fill={colors.electric} 
                  name="Deliveries" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Document Types Chart */}
        <div className="animate-zoom-in" style={{ animationDelay: '500ms' }}>
          <ChartCard title="Pending Documents by Type">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={documentTypes}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill={colors.violet} 
                  radius={[8, 8, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Document Status Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <div className="animate-zoom-in" style={{ animationDelay: '600ms' }}>
          <ChartCard title="Document Status Distribution">
            {chartData.length > 0 && chartData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={chartData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {chartData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(colors)[index % Object.values(colors).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] sm:h-[300px] text-gray-500 dark:text-gray-400 px-4">
                <span className="text-3xl sm:text-4xl mb-2">📊</span>
                <p className="text-xs sm:text-sm text-center">No document data available</p>
                <p className="text-xs mt-1 text-center">Document status distribution will appear here once documents are created</p>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Pending Tasks Table - Staff Style: Fade-slide-right */}
      {pendingTasks.length > 0 && (
        <div className="animate-fade-slide-right" style={{ animationDelay: '600ms' }}>
          <ChartCard title="Your Pending Tasks" className="col-span-full">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Doc #</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Type</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Date</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingTasks.map((task, index) => (
                      <tr
                        key={task.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                        style={{ 
                          animationDelay: `${700 + index * 80}ms`,
                          animation: 'fadeSlideRight 0.5s ease-out forwards',
                          opacity: 0,
                        }}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          #{task.id}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 whitespace-nowrap">
                            {task.docType?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            task.status === 'READY' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 animate-pulse-slow'
                              : task.status === 'WAITING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <Link
                            to={`/documents/${task.id}`}
                            className="inline-block px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-lg whitespace-nowrap"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-center">
              <Link
                to="/documents"
                className="inline-block px-4 sm:px-6 py-2 bg-gradient-to-r from-teal-600 to-electric-600 hover:from-teal-700 hover:to-electric-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-xl animate-glow-pulse"
              >
                View All Documents
              </Link>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Quick Actions - Staff Style: Bounce-in with staggered delays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="animate-bounce-in" style={{ animationDelay: '1100ms' }}>
          <Link
            to="/documents/new"
            className="glass-card-hover p-6 text-center group block"
          >
            <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-float">📥</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">New Receipt</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create a new receipt document</p>
          </Link>
        </div>
        <div className="animate-bounce-in" style={{ animationDelay: '1200ms' }}>
          <Link
            to="/documents/new"
            className="glass-card-hover p-6 text-center group block"
          >
            <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-float-delayed">📤</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">New Delivery</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create a new delivery document</p>
          </Link>
        </div>
        <div className="animate-bounce-in" style={{ animationDelay: '1300ms' }}>
          <Link
            to="/moves"
            className="glass-card-hover p-6 text-center group block"
          >
            <div className="text-4xl mb-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-float">🔄</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">View Moves</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track stock movements</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

