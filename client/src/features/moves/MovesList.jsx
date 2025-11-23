import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { movesAPI } from '../../api/moves';
import { productsAPI } from '../../api/products';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { Pagination } from '../../components/UI/Pagination';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { formatDate } from '../../utils/helpers';

export const MovesList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const itemsPerPage = 10;

  const { data, loading, error } = useApi(
    () => movesAPI.getAll({ 
      page, 
      limit: itemsPerPage,
      status: statusFilter || undefined,
    }),
    true,
    [page, statusFilter]
  );

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const moves = data?.data || [];
  const filteredMoves = moves.filter((move) =>
    !productSearch || 
    move.product?.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    move.product?.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );
  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DONE', label: 'Done' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'READY', label: 'Ready' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Moves</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View inventory moves and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Search Products"
          name="productSearch"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Search by product name or SKU..."
        />
        <Select
          label="Filter by Status"
          name="statusFilter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={statusOptions}
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>From Location</TableHeaderCell>
            <TableHeaderCell>To Location</TableHeaderCell>
            <TableHeaderCell>Quantity</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {filteredMoves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {productSearch ? 'No moves found matching your search' : 'No moves found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMoves.map((move) => (
                <TableRow key={move.id}>
                  <TableCell>{move.product?.name || '-'}</TableCell>
                  <TableCell>{move.fromLocation?.name || '-'}</TableCell>
                  <TableCell>{move.toLocation?.name || '-'}</TableCell>
                  <TableCell>{move.quantity || 0}</TableCell>
                  <TableCell>{formatDate(move.date || move.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        move.status === 'DONE' || move.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : move.status === 'CANCELED' || move.status === 'cancelled'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}
                    >
                      {move.status || 'pending'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data?.total || 0}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
};

