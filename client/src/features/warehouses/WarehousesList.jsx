import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { warehousesAPI } from '../../api/warehouses';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Input } from '../../components/UI/Input';
import { formatDate } from '../../utils/helpers';

export const WarehousesList = () => {
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, warehouseId: null });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, execute } = useApi(() => warehousesAPI.getAll(), true);

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    if (deleteModal.warehouseId) {
      setDeleteError(null);
      try {
        await warehousesAPI.delete(deleteModal.warehouseId);
        setDeleteModal({ isOpen: false, warehouseId: null });
        execute(); // Refresh list
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setDeleteError(errorMessage);
      }
    }
  };

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const warehouses = data?.data || [];
  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage warehouse locations</p>
        </div>
        {isInventoryManager() && (
          <Link to="/warehouses/new">
            <Button>Add Warehouse</Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <Input
          label="Search Warehouses"
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, code, or address..."
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Address</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {filteredWarehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No warehouses found matching your search' : 'No warehouses found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>
                    <Link to={`/warehouses/${warehouse.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {warehouse.name}
                    </Link>
                  </TableCell>
                  <TableCell>{warehouse.code || '-'}</TableCell>
                  <TableCell>{warehouse.address || '-'}</TableCell>
                  <TableCell>{formatDate(warehouse.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link to={`/warehouses/${warehouse.id}`}>
                        <Button variant="secondary" className="text-xs py-1 px-2">
                          View
                        </Button>
                      </Link>
                      {isInventoryManager() && (
                        <>
                          <Link to={`/warehouses/${warehouse.id}/edit`}>
                            <Button variant="secondary" className="text-xs py-1 px-2">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs py-1 px-2"
                            onClick={() => setDeleteModal({ isOpen: true, warehouseId: warehouse.id })}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteModal({ isOpen: false, warehouseId: null });
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message={
          deleteError 
            ? <Alert type="error" message={deleteError} />
            : "Are you sure you want to delete this warehouse? This action cannot be undone."
        }
        variant="danger"
      />
    </div>
  );
};

