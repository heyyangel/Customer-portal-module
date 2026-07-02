import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error } = useUserStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    const success = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password
    });
    
    if (success) {
      toast.success('Registration successful!');
      navigate('/');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-1">Create an account</h2>
      <p className="text-sm text-slate-500 font-medium mb-8">
        Join the Shraddha Impex Portal
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {errors.name && <p className="mt-1 text-xs text-error-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email address</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {errors.password && <p className="mt-1 text-xs text-error-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
          <input
            {...register('confirmPassword')}
            type="password"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-error-600">{errors.confirmPassword.message}</p>}
        </div>

        {error && (
          <div className="p-3 bg-error-50 text-error-700 text-sm rounded-md border border-error-200 font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" variant="primary" className="w-full bg-red-600 hover:bg-red-700 border-red-600" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-50 px-2 text-slate-500 font-medium">Already have an account?</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Sign in instead
          </Button>
        </div>
      </form>
    </div>
  );
};
