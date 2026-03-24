import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLogin } from '../../hooks/useAuth';
import { getErrorMessage } from '../../hooks/useErrorMessage';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const login = useLogin();

  useEffect(() => {
    const msg = sessionStorage.getItem('authError');
    if (msg) {
      setSessionError(msg);
      sessionStorage.removeItem('authError');
    }
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    login.mutate({ email: data.email, password: data.password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-500/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 text-white font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Zap className="w-5 h-5" />
          </div>
          SkillLink
        </div>

        {/* Centre text */}
        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Welcome back.<br />Let's get to work.
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Sign in and connect with skilled providers or post your next job — all in one place.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Find trusted providers in your area',
              'Secure payments and clear agreements',
              'Rated and reviewed by real clients',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative flex gap-8 text-white">
          <div>
            <p className="text-3xl font-bold">500+</p>
            <p className="text-blue-300 text-sm">Verified providers</p>
          </div>
          <div>
            <p className="text-3xl font-bold">1.2k+</p>
            <p className="text-blue-300 text-sm">Jobs completed</p>
          </div>
          <div>
            <p className="text-3xl font-bold">98%</p>
            <p className="text-blue-300 text-sm">Satisfaction rate</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 font-bold text-xl lg:hidden mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-blue-700">Skill<span className="text-green-600">Link</span></span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-1.5 text-gray-500 text-sm">Enter your details to access your account</p>
            </div>

            {sessionError && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                {sessionError}
              </div>
            )}

            {login.error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                {getErrorMessage(login.error)}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-700 hover:text-blue-800 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" fullWidth loading={login.isPending} size="lg" className="mt-2">
                Sign in to SkillLink
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                New to SkillLink?{' '}
                <Link to="/register" className="font-semibold text-blue-700 hover:underline">
                  Create a free account
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Your data is safe and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
