import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';
import { ROLES } from '../../utils/constants';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...signupData } = data;
    
    const result = await signup(signupData);
    setLoading(false);

    if (result.success) {
      // Redirect to dashboard - the Dashboard component will show role-based view
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
  };

  const roleOptions = [
    { value: ROLES.INVENTORY_MANAGER, label: 'Inventory Manager' },
    { value: ROLES.WAREHOUSE_STAFF, label: 'Warehouse Staff' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to="/auth/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              type="text"
              register={register}
              error={errors.name}
              placeholder="Full Name"
              rules={{ required: 'Name is required' }}
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              placeholder="Email address"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
            />
            <Select
              label="Role"
              name="role"
              register={register}
              error={errors.role}
              options={roleOptions}
              rules={{ required: 'Role is required' }}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              placeholder="Password"
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword}
              placeholder="Confirm Password"
              rules={{
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              }}
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader size="sm" /> : 'Sign up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

