import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { categoriesAPI } from '../../api/categories';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Input } from '../../components/UI/Input';
import { formatDate } from '../../utils/helpers';

export const CategoriesList = () => {
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, execute } = useApi(() => categoriesAPI.getAll(), true);

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    if (deleteModal.categoryId) {
      setDeleteError(null);
      try {
        await categoriesAPI.delete(deleteModal.categoryId);
        setDeleteModal({ isOpen: false, categoryId: null });
        execute(); // Refresh list
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setDeleteError(errorMessage);
        // Keep modal open on error so user can see the error
      }
    }
  };

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const categories = data?.data || [];
  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage product categories</p>
        </div>
        {isInventoryManager() && (
          <Link to="/categories/new">
            <Button>Add Category</Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <Input
          label="Search Categories"
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or description..."
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            {isInventoryManager() && <TableHeaderCell>Actions</TableHeaderCell>}
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isInventoryManager() ? 4 : 3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell>{formatDate(category.createdAt)}</TableCell>
                  {isInventoryManager() && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/categories/${category.id}/edit`}>
                          <Button variant="secondary" className="text-xs py-1 px-2">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          className="text-xs py-1 px-2"
                          onClick={() => setDeleteModal({ isOpen: true, categoryId: category.id })}
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
          setDeleteModal({ isOpen: false, categoryId: null });
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          deleteError 
            ? <Alert type="error" message={deleteError} />
            : "Are you sure you want to delete this category? This action cannot be undone."
        }
        variant="danger"
      />
    </div>
  );
};

