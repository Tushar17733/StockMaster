import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../api/auth';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    try {
      await authAPI.resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.password,
      });
      navigate('/auth/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email, OTP, and new password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}
          <div className="space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              placeholder="Email address"
              defaultValue={searchParams.get('email') || ''}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
            />
            <Input
              label="OTP"
              name="otp"
              type="text"
              register={register}
              error={errors.otp}
              placeholder="Enter OTP"
              rules={{ required: 'OTP is required' }}
            />
            <Input
              label="New Password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              placeholder="New Password"
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
              {loading ? <Loader size="sm" /> : 'Reset Password'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/auth/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

