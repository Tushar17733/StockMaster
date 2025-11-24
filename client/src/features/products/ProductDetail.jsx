import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { productsAPI } from '../../api/products';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { formatDate, formatCurrency } from '../../utils/helpers';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState(false);

  const { data: product, loading, error, execute } = useApi(
    () => productsAPI.getById(id),
    true,
    [id]
  );

  const handleDelete = async () => {
    try {
      await productsAPI.delete(id);
      // Success - redirect to products list
      navigate('/products', { replace: true });
    } catch (err) {
      // Handle error
      const errorMessage = getUserFriendlyError(err);
      alert(errorMessage); // Could be replaced with toast notification
    }
  };

  if (loading) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;
  if (!product) return <Alert type="error" message="Product not found" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Product Details</p>
        </div>
        {isInventoryManager() && (
          <div className="flex space-x-3">
            <Link to={`/products/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModal(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{product.sku || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{product.category?.name || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{formatCurrency(product.price || 0)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{product.totalQuantity || product.total_quantity || product.stock || 0}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{product.unitOfMeasure || product.unit || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(product.createdAt)}</p>
          </div>
          {product.description && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};

