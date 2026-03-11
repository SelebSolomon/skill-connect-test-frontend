import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Briefcase, Users, Star, Search,
  CheckCircle, Clock, ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { JobCard } from '../components/shared/JobCard';
import { ProfileCard } from '../components/shared/ProfileCard';
import { Spinner } from '../components/ui/Spinner';
import { jobsApi } from '../api/jobs.api';
import { profileApi } from '../api/profile.api';
import { servicesApi } from '../api/services.api';

export function HomePage() {
  const { data: jobsData } = useQuery({
    queryKey: ['jobs', { limit: 6 }],
    queryFn: () => jobsApi.getJobs({ limit: 6 }),
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['profiles', { limit: 4 }],
    queryFn: () => profileApi.queryProfiles({ limit: 4 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: servicesApi.getCategories,
  });

  const jobs = jobsData?.data ?? [];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-32 min-h-[560px] flex items-center">
        {/* Background photo — diverse skilled workers */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80&auto=format&fit=crop')",
          }}
        />
        {/* Deep blue overlay for readability */}
        <div className="absolute inset-0 bg-blue-900/80" />
        {/* Subtle grid texture on top */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Green accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-blue-100 font-medium mb-8 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Trusted by thousands across Nigeria
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-slide-up">
            Find skilled help{' '}
            <span className="text-green-400">near you</span>,
            <br className="hidden sm:block" />
            fast and trusted
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto animate-slide-up anim-delay-100">
            Post a job or browse providers for any service — from home repairs to professional work. All providers are verified and rated by real clients.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up anim-delay-200">
            <Link to="/jobs">
              <Button size="lg" variant="primary" className="shadow-lg shadow-green-900/30">
                <Search className="w-5 h-5" />
                Browse Available Jobs
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/25 backdrop-blur-sm shadow-sm">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Quick trust signals */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-blue-300 animate-fade-in anim-delay-300">
            {['No hidden fees', 'Verified providers', 'Secure payments', '24-hour support'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center">
            {[
              { icon: <Briefcase className="w-6 h-6 text-blue-600" />,  bg: 'bg-blue-50',  value: '1,200+', label: 'Jobs posted' },
              { icon: <Users     className="w-6 h-6 text-green-600" />, bg: 'bg-green-50', value: '500+',   label: 'Verified providers' },
              { icon: <Star      className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-50', value: '4.9/5',  label: 'Average rating' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className={`mx-auto w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How SkillLink works</h2>
            <p className="mt-2 text-gray-500">Three simple steps to get any job done</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <Briefcase className="w-6 h-6 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'Post your job',
                desc: 'Describe what you need done, set your budget, and add your location. It takes less than 2 minutes.',
              },
              {
                step: '2',
                icon: <Users className="w-6 h-6 text-green-600" />,
                bg: 'bg-green-50',
                title: 'Receive bids',
                desc: 'Verified local providers send you their best offers. Compare prices, read reviews, and pick the best fit.',
              },
              {
                step: '3',
                icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
                bg: 'bg-blue-50',
                title: 'Get it done',
                desc: 'Work gets completed, payment is released, and you leave a review. Simple, safe, and straightforward.',
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Categories ───────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Browse by category</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat: string) => (
                <Link
                  key={cat}
                  to={`/jobs?category=${encodeURIComponent(cat)}`}
                  className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 shadow-sm"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Jobs ─────────────────────────────────────────────────── */}
      {jobs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Latest jobs</h2>
                <p className="text-sm text-gray-500 mt-1">Browse what people need help with right now</p>
              </div>
              <Link
                to="/jobs"
                className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Providers ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top providers</h2>
              <p className="text-sm text-gray-500 mt-1">Verified and highly rated professionals</p>
            </div>
            <Link
              to="/providers"
              className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {providersLoading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(providers ?? []).map((profile) => (
                <ProfileCard key={profile._id} profile={profile} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to get something done?</h2>
          <p className="mt-4 text-blue-200 text-lg max-w-xl mx-auto">
            Join thousands of clients and providers already using SkillLink to connect and get work done.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=client">
              <Button size="lg" variant="primary" className="shadow-lg shadow-green-900/30">
                <Clock className="w-5 h-5" />
                Post a job — it's free
              </Button>
            </Link>
            <Link to="/register?role=provider">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/25">
                Offer your skills
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
