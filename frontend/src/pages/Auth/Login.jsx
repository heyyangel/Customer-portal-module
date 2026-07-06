import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
});

// The portal comes in two flavours, reached at two different URLs. They share the
// same auth flow but present differently and each only admits a specific audience:
//   /login      → Non-MSIL customers and Admins
//   /msil-login → MSIL customers only
// `allows(user)` decides who may pass; anyone else is bounced to their own portal.
// See routes/index.jsx.
export const LOGIN_VARIANTS = {
  standard: {
    allows: (u) => u?.role === 'Admin' || u?.customerCategory !== 'MSIL',
    badge: 'Customer Portal',
    accent: 'text-red-600',
    button: 'bg-red-600 hover:bg-red-700 border-red-600',
    ring: 'focus:ring-red-500 focus:border-red-500',
    icon: Building2,
    title: 'Sign in to your account',
    subtitle: 'Welcome to the Shraddha Impex Customer Portal',
    placeholder: 'customer@example.com',
    otherPath: '/msil-login',
    otherPrompt: 'Are you an MSIL User?',
    otherLabel: 'Use the MSIL login',
    wrongPortalMsg: 'MSIL user must sign in through the MSIL login.',
  },
  msil: {
    allows: (u) => u?.role !== 'Admin' && u?.customerCategory === 'MSIL',
    badge: 'MSIL Portal',
    accent: 'text-blue-700',
    button: 'bg-blue-700 hover:bg-blue-800 border-blue-700',
    ring: 'focus:ring-blue-600 focus:border-blue-600',
    icon: ShieldCheck,
    title: 'MSIL Sign In',
    subtitle: 'For Maruti Suzuki (MSIL) authorized partners',
    placeholder: 'partner@msil.example.com',
    otherPath: '/login',
    otherPrompt: 'Not an MSIL User?',
    otherLabel: 'Use the standard login',
    wrongPortalMsg: 'Only MSIL User can sign in here. Please use the standard login.',
  },
};

export const Login = ({ variant = 'standard' }) => {
  const cfg = LOGIN_VARIANTS[variant] || LOGIN_VARIANTS.standard;
  const Icon = cfg.icon;
  const navigate = useNavigate();
  const { login, logout, loading, error } = useUserStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const success = await login(data);
    if (!success) return;

    // Gate the portal: /msil-login is MSIL-only; /login is for Non-MSIL and Admins.
    const u = useUserStore.getState().user;
    if (!cfg.allows(u)) {
      logout();
      toast.error(cfg.wrongPortalMsg);
      navigate(u?.customerCategory === 'MSIL' ? '/msil-login' : '/login');
      return;
    }

    toast.success('Login successful!');
    navigate('/');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full bg-slate-100 ${cfg.accent}`}>
          <Icon size={14} /> {cfg.badge}
        </span>
      </div>

      <h2 className="text-2xl font-black text-slate-900 mb-1">{cfg.title}</h2>
      <p className="text-sm text-slate-500 font-medium mb-8">{cfg.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email address</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 text-sm ${cfg.ring}`}
            placeholder={cfg.placeholder}
          />
          {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 text-sm ${cfg.ring}`}
          />
          {errors.password && <p className="mt-1 text-xs text-error-600">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="p-3 bg-error-50 text-error-700 text-sm rounded-md border border-error-200 font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" variant="primary" className={`w-full ${cfg.button}`} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-50 px-2 text-slate-500 font-medium">{cfg.otherPrompt}</span>
            </div>
          </div>

          <Link
            to={cfg.otherPath}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            {cfg.otherLabel}
          </Link>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/register')}
          >
            Create an Account
          </Button>
        </div>
      </form>
    </div>
  );
};
