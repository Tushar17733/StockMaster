import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { profileAPI } from '../../api/profile';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch latest profile data
  const { data: profileData, loading: profileLoading } = useApi(() => profileAPI.get(), true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // Update form when profile data loads
  useEffect(() => {
    if (profileData) {
      reset({
        name: profileData.name || '',
        phone: profileData.phone || '',
        defaultWarehouseId: profileData.defaultWarehouse?.id || '',
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await profileAPI.update(data);
      setSuccess(true);
      // Refresh user data in context
      setTimeout(() => {
        window.location.reload(); // Simple refresh to update context
      }, 1000);
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (profileLoading) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your account settings</p>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message="Profile updated successfully" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              register={register}
              error={errors.name}
              rules={{ required: 'Name is required' }}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
            />
            <div className="md:col-span-2">
              <label className="label">Role</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{user?.role?.replace('_', ' ') || '-'}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader size="sm" /> : 'Update Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

