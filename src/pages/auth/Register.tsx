import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, Briefcase, Wrench, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useRegister } from '../../hooks/useAuth';
import { getErrorMessage } from '../../hooks/useErrorMessage';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  phone:    z.string().min(7, 'Enter a valid phone number'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  roleName: z.enum(['client', 'provider']).default('client'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { roleName: 'client' },
  });

  const selectedRole = watch('roleName');

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-800 p-12 flex-col justify-between relative overflow-hidden">
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

        {/* Role cards */}
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Start your journey<br />on SkillLink today
          </h1>
          {[
            {
              role: 'client',
              icon: <Briefcase className="w-5 h-5" />,
              title: 'I need help (Client)',
              desc: 'Post jobs, compare bids, and hire trusted providers in your area.',
            },
            {
              role: 'provider',
              icon: <Wrench className="w-5 h-5" />,
              title: 'I offer skills (Provider)',
              desc: 'Showcase your expertise, receive job offers, and grow your income.',
            },
          ].map((item) => (
            <div
              key={item.role}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                selectedRole === item.role
                  ? 'bg-white/15 border-green-400/60 shadow-sm'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={selectedRole === item.role ? 'text-green-400' : 'text-blue-300'}>
                  {item.icon}
                </span>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                {selectedRole === item.role && (
                  <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </div>
              <p className="text-blue-200 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="relative text-blue-300 text-sm">
          Join thousands of people already using SkillLink across Nigeria.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 font-bold text-xl lg:hidden mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-blue-700">Skill<span className="text-green-600">Link</span></span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="mt-1.5 text-gray-500 text-sm">Free to join. No hidden charges.</p>
            </div>

            {registerMutation.error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                {getErrorMessage(registerMutation.error)}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="I want to"
                options={[
                  { value: 'client',   label: 'Hire — post jobs and find providers' },
                  { value: 'provider', label: 'Work — offer my skills and earn money' },
                ]}
                error={errors.roleName?.message}
                {...register('roleName')}
              />

              <Input
                label="Full name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Phone number"
                type="tel"
                placeholder="+234 800 000 0000"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  error={errors.password?.message}
                  hint="Min. 6 chars — include a number, uppercase, and symbol"
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

              <Button type="submit" fullWidth loading={registerMutation.isPending} size="lg" className="mt-2">
                Create my account — it's free
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
