import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { dashboardAPI } from '../../api/dashboard';
import { productsAPI } from '../../api/products';
import { documentsAPI } from '../../api/documents';
import { KPICard } from '../../components/UI/KPICard';
import { ChartCard } from '../../components/UI/ChartCard';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { useAuth } from '../../contexts/AuthContext';
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

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [chartData, setChartData] = useState([]);

  const { data: summaryData, loading: summaryLoading, error: summaryError } = useApi(
    () => dashboardAPI.getSummary(),
    true
  );

  const { data: lowStockData, loading: lowStockLoading } = useApi(
    () => dashboardAPI.getLowStockItems(),
    true
  );

  const { data: productsData } = useApi(
    () => productsAPI.getAll({ limit: 100 }),
    true
  );

  const { data: documentsData } = useApi(
    () => documentsAPI.getAll({ limit: 100 }),
    true
  );

  useEffect(() => {
    // API now returns data directly (already extracted and transformed)
    if (summaryData) {
      setSummary(summaryData);
    }
  }, [summaryData]);

  useEffect(() => {
    // API now returns { lowStockItems: [...] }
    if (lowStockData?.lowStockItems) {
      setLowStockItems(lowStockData.lowStockItems.slice(0, 5));
    }
  }, [lowStockData]);

  useEffect(() => {
    // API now returns { data: [...], total, page, limit }
    if (documentsData?.data) {
      const docs = documentsData.data;
      const statusCounts = docs.reduce((acc, doc) => {
        const status = doc.status || 'DRAFT';
        acc[status] = (acc[status] || 0) + 1;
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

  const loading = summaryLoading || lowStockLoading;
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? DARK_COLORS : COLORS;

  // Monthly trend data (mock for now)
  const monthlyTrend = [
    { month: 'Jan', products: 120, documents: 45 },
    { month: 'Feb', products: 135, documents: 52 },
    { month: 'Mar', products: 148, documents: 48 },
    { month: 'Apr', products: 165, documents: 61 },
    { month: 'May', products: 180, documents: 55 },
    { month: 'Jun', products: 195, documents: 68 },
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
      {/* Welcome Header - Manager Style: Elegant slide-left animation */}
      <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 animate-slide-left">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 via-violet-600 to-primary-600 dark:from-primary-400 dark:via-violet-400 dark:to-primary-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto] break-words">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-1 sm:mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg">
              Here's your comprehensive inventory management overview
            </p>
          </div>
          <div className="hidden md:block animate-float flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-violet-500/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl md:text-4xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Manager Style: Sophisticated fade-slide-up with staggered delays */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
          <KPICard
            title="Products in Stock"
            value={summary?.total_products_in_stock || 0}
            icon="📦"
            color="primary"
            delay={0}
          />
        </div>
        <div className="animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          <KPICard
            title="Low Stock Items"
            value={summary?.low_stock_items_count || 0}
            icon="⚠️"
            color="electric"
            delay={100}
            trend={summary?.low_stock_items_count > 0 ? 'up' : null}
            trendValue={summary?.low_stock_items_count > 0 ? 'Needs attention' : null}
          />
        </div>
        <div className="animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
          <KPICard
            title="Out of Stock"
            value={summary?.out_of_stock_items_count || 0}
            icon="🚨"
            color="violet"
            delay={200}
            trend={summary?.out_of_stock_items_count > 0 ? 'up' : null}
            trendValue={summary?.out_of_stock_items_count > 0 ? 'Urgent' : null}
          />
        </div>
        <div className="animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
          <KPICard
            title="Pending Receipts"
            value={summary?.pending_receipts_count || 0}
            icon="📥"
            color="teal"
            delay={300}
          />
        </div>
      </div>

      {/* Secondary KPIs - Manager Style: Scale-up animation */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="animate-scale-up" style={{ animationDelay: '400ms' }}>
          <KPICard
            title="Pending Deliveries"
            value={summary?.pending_deliveries_count || 0}
            icon="📤"
            color="electric"
            delay={400}
          />
        </div>
        <div className="animate-scale-up" style={{ animationDelay: '500ms' }}>
          <KPICard
            title="Internal Transfers"
            value={summary?.internal_transfers_scheduled_count || 0}
            icon="🔄"
            color="violet"
            delay={500}
          />
        </div>
        <div className="animate-scale-up" style={{ animationDelay: '600ms' }}>
          <KPICard
            title="Total Documents"
            value={documentsData?.total || (documentsData?.data ? documentsData.data.length : 0)}
            icon="📄"
            color="teal"
            delay={600}
          />
        </div>
      </div>

      {/* Charts Row - Manager Style: Rotate-in and zoom-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Monthly Trend Chart */}
        <div className="animate-rotate-in" style={{ animationDelay: '700ms' }}>
          <ChartCard title="Monthly Trend Analysis">
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
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
                <Line
                  type="monotone"
                  dataKey="products"
                  stroke={colors.primary}
                  strokeWidth={3}
                  dot={{ fill: colors.primary, r: 5 }}
                  name="Products"
                  animationDuration={1000}
                />
                <Line
                  type="monotone"
                  dataKey="documents"
                  stroke={colors.teal}
                  strokeWidth={3}
                  dot={{ fill: colors.teal, r: 5 }}
                  name="Documents"
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Document Status Pie Chart */}
        <div className="animate-zoom-in" style={{ animationDelay: '800ms' }}>
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

      {/* Low Stock Items Table - Manager Style: Slide-fade animation */}
      {lowStockItems.length > 0 && (
        <div className="animate-slide-fade" style={{ animationDelay: '900ms' }}>
          <ChartCard title="Low Stock Items - Action Required" className="col-span-full">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Product Name</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Category</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Min</th>
                      <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800/30 divide-y divide-gray-200 dark:divide-gray-700">
                    {lowStockItems.map((item, index) => (
                      <tr
                        key={item.product_id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                        style={{ 
                          animationDelay: `${1000 + index * 100}ms`,
                          animation: 'fadeSlideUp 0.5s ease-out forwards',
                          opacity: 0,
                        }}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {item.sku}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 hidden sm:table-cell truncate max-w-[150px]">
                          {item.name}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          {item.category?.name || 'N/A'}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                          {item.total_qty}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {item.min_qty}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse-slow whitespace-nowrap">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

