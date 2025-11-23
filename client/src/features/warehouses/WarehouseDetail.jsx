import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { warehousesAPI } from '../../api/warehouses';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { formatDate } from '../../utils/helpers';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';

export const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState(false);

  const { data: warehouse, loading, error, execute } = useApi(
    () => warehousesAPI.getById(id),
    true,
    [id]
  );

  const handleDelete = async () => {
    try {
      await warehousesAPI.delete(id);
      // Success - redirect to warehouses list
      navigate('/warehouses', { replace: true });
    } catch (err) {
      // Handle error
      const errorMessage = getUserFriendlyError(err);
      alert(errorMessage); // Could be replaced with toast notification
    }
  };

  if (loading) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;
  if (!warehouse) return <Alert type="error" message="Warehouse not found" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{warehouse.name}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Warehouse Details</p>
        </div>
        {isInventoryManager() && (
          <div className="flex space-x-3">
            <Link to={`/warehouses/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModal(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{warehouse.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Code</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{warehouse.code || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{warehouse.address || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(warehouse.createdAt)}</p>
          </div>
          {warehouse.locations && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Locations</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{warehouse.locations.length || 0}</p>
            </div>
          )}
        </div>
      </div>

      {warehouse.locations && warehouse.locations.length > 0 && (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Locations</h2>
          </div>
          <Table>
            <TableHeader>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeader>
            <TableBody>
              {warehouse.locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.locationType || location.type || '-'}</TableCell>
                  <TableCell>
                    <Link to={`/locations/${location.id}`}>
                      <Button variant="secondary" className="text-xs py-1 px-2">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};

