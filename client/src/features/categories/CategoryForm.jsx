import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { categoriesAPI } from '../../api/categories';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: categoryData, loading: categoryLoading } = useApi(
    () => categoriesAPI.getById(id),
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
    if (categoryData && isEdit) {
      reset(categoryData);
    }
  }, [categoryData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await categoriesAPI.update(id, data);
      } else {
        await categoriesAPI.create(data);
      }
      // Success - redirect to categories list
      navigate('/categories', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (categoryLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Category' : 'New Category'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Category Name"
              name="name"
              register={register}
              error={errors.name}
              rules={{ required: 'Category name is required' }}
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
              onClick={() => navigate('/categories')}
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

