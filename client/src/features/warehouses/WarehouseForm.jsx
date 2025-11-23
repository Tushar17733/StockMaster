import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { warehousesAPI } from '../../api/warehouses';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const WarehouseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: warehouseData, loading: warehouseLoading } = useApi(
    () => warehousesAPI.getById(id),
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
    if (warehouseData && isEdit) {
      reset(warehouseData);
    }
  }, [warehouseData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await warehousesAPI.update(id, data);
      } else {
        await warehousesAPI.create(data);
      }
      // Success - redirect to warehouses list
      navigate('/warehouses', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (warehouseLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Warehouse' : 'New Warehouse'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Warehouse Name"
              name="name"
              register={register}
              error={errors.name}
              rules={{ required: 'Warehouse name is required' }}
            />
            <Input
              label="Code"
              name="code"
              register={register}
              error={errors.code}
              placeholder="Optional warehouse code"
            />
            <div className="md:col-span-2">
              <label htmlFor="address" className="label">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                className="input-field h-24"
                {...register('address')}
                placeholder="Warehouse address"
              />
              {errors.address && <p className="error-text">{errors.address.message}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/warehouses')}
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

