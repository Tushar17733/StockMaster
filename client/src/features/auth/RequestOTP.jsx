import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../api/auth';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';

export const RequestOTP = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await authAPI.requestOTP(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Request Password Reset
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email to receive a password reset OTP
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}
          {success && (
            <Alert
              type="success"
              message="OTP has been sent to your email. Please check your inbox."
            />
          )}
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

          <div>
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? <Loader size="sm" /> : 'Send OTP'}
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

