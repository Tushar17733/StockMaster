import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { productsAPI } from '../../api/products';
import { categoriesAPI } from '../../api/categories';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: categoriesData } = useApi(() => categoriesAPI.getAll(), true);
  const { data: productData, loading: productLoading } = useApi(
    () => productsAPI.getById(id),
    isEdit,
    [id]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (productData && isEdit) {
      reset(productData);
    }
  }, [productData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await productsAPI.update(id, data);
      } else {
        await productsAPI.create(data);
      }
      // Success - redirect to products list
      navigate('/products', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const categoryOptions =
    categoriesData?.data?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [];

  if (productLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Product' : 'New Product'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              name="name"
              register={register}
              error={errors.name}
              rules={{ required: 'Product name is required' }}
            />
            <Input
              label="SKU"
              name="sku"
              register={register}
              error={errors.sku}
            />
            <Select
              label="Category"
              name="categoryId"
              register={register}
              error={errors.categoryId}
              options={categoryOptions}
              rules={{ required: 'Category is required' }}
            />
            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              register={register}
              error={errors.price}
              rules={{ required: 'Price is required', min: { value: 0, message: 'Price must be positive' } }}
            />
            <Input
              label="Stock Quantity"
              name="stock"
              type="number"
              register={register}
              error={errors.stock}
              rules={{ min: { value: 0, message: 'Stock must be positive' } }}
            />
            <Input
              label="Unit"
              name="unit"
              register={register}
              error={errors.unit}
              placeholder="e.g., kg, pcs, box"
            />
          </div>

          <div className="mt-6">
            <div className="mb-4">
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="input-field h-24"
                {...register('description')}
              />
              {errors.description && <p className="error-text">{errors.description.message}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader size="sm" /> : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

