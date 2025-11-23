import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reorderRulesAPI } from '../../api/reorderRules';
import { productsAPI } from '../../api/products';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const ReorderRuleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const { data: productsData } = useApi(
    () => productsAPI.getAll({ search: productSearch, limit: 20 }),
    productSearch.length > 0 || !isEdit
  );
  const { data: ruleData, loading: ruleLoading } = useApi(
    () => reorderRulesAPI.getById(id),
    isEdit,
    [id]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  useEffect(() => {
    if (ruleData && isEdit) {
      reset({
        ...ruleData,
        productId: ruleData.productId || ruleData.product?.id,
        minQty: ruleData.minQty || ruleData.minQuantity,
        preferredQty: ruleData.preferredQty || ruleData.preferredQuantity || ruleData.maxQty || ruleData.maxQuantity,
      });
    }
  }, [ruleData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await reorderRulesAPI.update(id, {
          minQty: parseInt(data.minQty),
          preferredQty: data.preferredQty ? parseInt(data.preferredQty) : null,
        });
      } else {
        await reorderRulesAPI.create({
          productId: parseInt(data.productId),
          minQty: parseInt(data.minQty),
          preferredQty: data.preferredQty ? parseInt(data.preferredQty) : null,
        });
      }
      // Success - redirect to reorder rules list
      navigate('/reorder-rules', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const productOptions =
    productsData?.data?.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.sku || 'N/A'})`,
    })) || [];

  if (ruleLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Reorder Rule' : 'New Reorder Rule'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isEdit && (
              <div className="md:col-span-2">
                <label className="label">Search Product</label>
                <input
                  type="text"
                  className="input-field"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Type to search products..."
                />
                <Select
                  label="Product"
                  name="productId"
                  register={register}
                  error={errors.productId}
                  options={productOptions}
                  rules={{ required: 'Product is required' }}
                />
              </div>
            )}
            {isEdit && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {ruleData?.product?.name || '-'}
                </p>
              </div>
            )}
            <Input
              label="Minimum Quantity"
              name="minQty"
              type="number"
              register={register}
              error={errors.minQty}
              rules={{ 
                required: 'Minimum quantity is required',
                min: { value: 0, message: 'Minimum quantity must be 0 or greater' }
              }}
            />
            <Input
              label="Preferred/Maximum Quantity (Optional)"
              name="preferredQty"
              type="number"
              register={register}
              error={errors.preferredQty}
              rules={{ 
                min: { value: 0, message: 'Preferred quantity must be 0 or greater' }
              }}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/reorder-rules')}
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

