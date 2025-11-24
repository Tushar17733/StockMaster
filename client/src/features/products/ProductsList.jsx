import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { productsAPI } from '../../api/products';
import { categoriesAPI } from '../../api/categories';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { Pagination } from '../../components/UI/Pagination';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { formatDate, formatCurrency } from '../../utils/helpers';

export const ProductsList = () => {
  const { isInventoryManager } = useAuth();
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const itemsPerPage = 10;

  const { data: categoriesData } = useApi(() => categoriesAPI.getAll(), true);

  const { data, loading, error, execute } = useApi(
    () => productsAPI.getAll({ 
      page, 
      limit: itemsPerPage,
      search: searchTerm || undefined,
      categoryId: categoryFilter || undefined,
    }),
    true,
    [page, searchTerm, categoryFilter]
  );

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    if (deleteModal.productId) {
      setDeleteError(null);
      try {
        await productsAPI.delete(deleteModal.productId);
        setDeleteModal({ isOpen: false, productId: null });
        execute(); // Refresh list
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setDeleteError(errorMessage);
      }
    }
  };

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  // API now returns { data: { products: [...], pagination: {...} } }
  const products = data?.data?.products || data?.data || [];
  const totalPages = Math.ceil((data?.data?.pagination?.total || data?.total || 0) / itemsPerPage);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categoriesData?.data?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [])
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Products</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your inventory products</p>
        </div>
        {isInventoryManager() && (
          <Link to="/products/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Add Product</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <Input
          label="Search Products"
          name="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or SKU..."
        />
        <Select
          label="Filter by Category"
          name="categoryFilter"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          options={categoryOptions}
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Price</TableHeaderCell>
            <TableHeaderCell>Stock</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            {isInventoryManager() && <TableHeaderCell>Actions</TableHeaderCell>}
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isInventoryManager() ? 7 : 6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link to={`/products/${product.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{product.sku || '-'}</TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(product.price || 0)}</TableCell>
                  <TableCell>{product.total_quantity || product.totalQuantity || product.stock || 0}</TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  {isInventoryManager() && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link to={`/products/${product.id}`}>
                          <Button variant="secondary" className="text-xs py-1 px-2">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          className="text-xs py-1 px-2"
                          onClick={() => setDeleteModal({ isOpen: true, productId: product.id })}
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

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data?.data?.pagination?.total || data?.total || 0}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteModal({ isOpen: false, productId: null });
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={
          deleteError 
            ? <Alert type="error" message={deleteError} />
            : "Are you sure you want to delete this product? This action cannot be undone."
        }
        variant="danger"
      />
    </div>
  );
};

