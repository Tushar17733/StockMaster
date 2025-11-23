import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { documentsAPI } from '../../api/documents';
import { useAuth } from '../../contexts/AuthContext';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { Pagination } from '../../components/UI/Pagination';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { formatDate } from '../../utils/helpers';

export const DocumentsList = () => {
  const { isInventoryManager } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const itemsPerPage = 10;

  const { data, loading, error } = useApi(
    () => documentsAPI.getAll({ 
      page, 
      limit: itemsPerPage,
      status: statusFilter || undefined,
      docType: docTypeFilter || undefined,
    }),
    true,
    [page, statusFilter, docTypeFilter]
  );

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const documents = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'WAITING', label: 'Waiting' },
    { value: 'READY', label: 'Ready' },
    { value: 'DONE', label: 'Done' },
    { value: 'CANCELED', label: 'Canceled' },
  ];

  const docTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'INTERNAL_TRANSFER', label: 'Internal Transfer' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Documents</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage inventory documents</p>
        </div>
        {isInventoryManager() && (
          <Link to="/documents/new">
            <Button>New Document</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select
          label="Filter by Type"
          name="docTypeFilter"
          value={docTypeFilter}
          onChange={(e) => {
            setDocTypeFilter(e.target.value);
            setPage(1);
          }}
          options={docTypeOptions}
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
            <TableHeaderCell>Document Number</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Link to={`/documents/${document.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {document.documentNumber || document.id}
                    </Link>
                  </TableCell>
                  <TableCell>{document.docType || document.type || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        document.status === 'DONE' || document.status === 'validated'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : document.status === 'CANCELED' || document.status === 'cancelled'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}
                    >
                      {document.status || 'DRAFT'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(document.date || document.createdAt)}</TableCell>
                  <TableCell>
                    <Link to={`/documents/${document.id}`}>
                      <Button variant="secondary" className="text-xs py-1 px-2">
                        View
                      </Button>
                    </Link>
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

