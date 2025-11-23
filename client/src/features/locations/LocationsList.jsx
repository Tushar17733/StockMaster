import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { locationsAPI } from '../../api/locations';
import { warehousesAPI } from '../../api/warehouses';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { formatDate } from '../../utils/helpers';

export const LocationsList = () => {
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, locationId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const { data, loading, error, execute } = useApi(() => locationsAPI.getAll(), true);
  const { data: warehousesData } = useApi(() => warehousesAPI.getAll(), true);

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    if (deleteModal.locationId) {
      setDeleteError(null);
      try {
        await locationsAPI.delete(deleteModal.locationId);
        setDeleteModal({ isOpen: false, locationId: null });
        execute(); // Refresh list
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setDeleteError(errorMessage);
      }
    }
  };

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const locations = data?.data || [];
  const filteredLocations = locations.filter((location) => {
    const matchesSearch = 
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = !warehouseFilter || location.warehouseId === parseInt(warehouseFilter);
    return matchesSearch && matchesWarehouse;
  });

  const warehouseOptions = [
    { value: '', label: 'All Warehouses' },
    ...(warehousesData?.data?.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })) || [])
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Locations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage storage locations</p>
        </div>
        {isInventoryManager() && (
          <Link to="/locations/new">
            <Button>Add Location</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          label="Search Locations"
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or warehouse..."
        />
        <Select
          label="Filter by Warehouse"
          name="warehouseFilter"
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          options={warehouseOptions}
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Warehouse</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            {isInventoryManager() && <TableHeaderCell>Actions</TableHeaderCell>}
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isInventoryManager() ? 5 : 4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm || warehouseFilter ? 'No locations found matching your filters' : 'No locations found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.warehouse?.name || '-'}</TableCell>
                  <TableCell>{location.locationType || location.type || '-'}</TableCell>
                  <TableCell>{formatDate(location.createdAt)}</TableCell>
                  {isInventoryManager() && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/locations/${location.id}/edit`}>
                          <Button variant="secondary" className="text-xs py-1 px-2">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          className="text-xs py-1 px-2"
                          onClick={() => setDeleteModal({ isOpen: true, locationId: location.id })}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteModal({ isOpen: false, locationId: null });
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Location"
        message={
          deleteError 
            ? <Alert type="error" message={deleteError} />
            : "Are you sure you want to delete this location? This action cannot be undone."
        }
        variant="danger"
      />
    </div>
  );
};

