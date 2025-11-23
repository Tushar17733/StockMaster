import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { locationsAPI } from '../../api/locations';
import { warehousesAPI } from '../../api/warehouses';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const LocationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: warehousesData } = useApi(() => warehousesAPI.getAll(), true);
  const { data: locationData, loading: locationLoading } = useApi(
    () => locationsAPI.getById(id),
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
    if (locationData && isEdit) {
      reset({
        ...locationData,
        warehouseId: locationData.warehouseId || locationData.warehouse?.id,
      });
    }
  }, [locationData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await locationsAPI.update(id, data);
      } else {
        await locationsAPI.create(data);
      }
      // Success - redirect to locations list
      navigate('/locations', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const warehouseOptions =
    warehousesData?.data?.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    })) || [];

  const locationTypeOptions = [
    { value: 'INTERNAL', label: 'Internal' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'SCRAP', label: 'Scrap' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ];

  if (locationLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Location' : 'New Location'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isEdit && (
              <Select
                label="Warehouse"
                name="warehouseId"
                register={register}
                error={errors.warehouseId}
                options={warehouseOptions}
                rules={{ required: 'Warehouse is required' }}
              />
            )}
            <Input
              label="Location Name"
              name="name"
              register={register}
              error={errors.name}
              rules={{ required: 'Location name is required' }}
            />
            <Select
              label="Location Type"
              name="locationType"
              register={register}
              error={errors.locationType}
              options={locationTypeOptions}
              rules={{ required: 'Location type is required' }}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/locations')}
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

