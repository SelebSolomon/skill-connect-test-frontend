import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ArrowRight, Briefcase, Users, Star, Search,
  CheckCircle, Clock, ShieldCheck, Hammer, Wrench, Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { JobCard } from '../components/shared/JobCard';
import { ProfileCard } from '../components/shared/ProfileCard';
import { Spinner } from '../components/ui/Spinner';
import { jobsApi } from '../api/jobs.api';
import { profileApi } from '../api/profile.api';
import { servicesApi } from '../api/services.api';
import { useAuthStore } from '../store/auth.store';

// ─── Hero background slideshow — one slide per trade ────────────────────────
const HERO_SLIDES = [
  {
    // mechanic repairing car engine — hands on engine bay
    url: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=1920&q=85&auto=format&fit=crop',
    label: 'Auto Mechanic',
  },
  {
    // barber / hairdresser cutting client's hair in salon
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&q=85&auto=format&fit=crop',
    label: 'Barber & Hair',
  },
  {
    // carpenter cutting / measuring wood on workbench
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=85&auto=format&fit=crop',
    label: 'Carpentry',
  },
  {
    // tailor / seamstress sewing fabric on machine
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85&auto=format&fit=crop',
    label: 'Tailoring',
  },
  {
    // electrician working on wiring / electrical panel
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=85&auto=format&fit=crop',
    label: 'Electrical Work',
  },
  {
    // plumber fixing pipe under sink
    url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1920&q=85&auto=format&fit=crop',
    label: 'Plumbing',
  },
];

// ─── Trade showcase grid ──────────────────────────────────────────────────────
const TRADES = [
  {
    title: 'Auto Mechanic',
    // mechanic under car / engine bay
    url: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Barber & Hair',
    // barber cutting hair in salon chair
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Carpentry',
    // carpenter with wood / saw on workbench
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Tailoring',
    // tailor threading / sewing on machine
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Electrician',
    // electrician with cables / panel
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Plumbing',
    // plumber with pipe / wrench
    url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'House Painting',
    // painter with roller / wall
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Welding',
    // welder with sparks / mask
    url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&auto=format&fit=crop',
  },
  {
    title: 'Chef & Catering',
    // chef cooking / preparing food in kitchen
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&auto=format&fit=crop',
  },
];

// ─── Adinkra-inspired SVG pattern used in section backgrounds ─────────────────
function AdinkraPattern({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="adinkra" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          {/* Gye Nyame — simplified diamond/cross motif */}
          <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="32" y1="14" x2="32" y2="50" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="32" x2="50" y2="32" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="20" x2="44" y2="44" stroke="currentColor" strokeWidth="0.6" />
          <line x1="44" y1="20" x2="20" y2="44" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adinkra)" />
    </svg>
  );
}

export function HomePage() {
  const { isAuthenticated, user } = useAuthStore();

  // ── Hero background slideshow ──────────────────────────────────────────────
  const [slideIndex, setSlideIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
        setFadeIn(true);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[620px] flex items-center py-24 sm:py-32">
        {/* Sliding background — African workers across trades */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-opacity duration-700"
          style={{
            backgroundImage: `url('${HERO_SLIDES[slideIndex].url}')`,
            opacity: fadeIn ? 1 : 0,
          }}
          aria-label={HERO_SLIDES[slideIndex].label}
        />

        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFadeIn(false); setTimeout(() => { setSlideIndex(i); setFadeIn(true); }, 300); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === slideIndex ? 'bg-amber-400 w-5' : 'bg-white/40 hover:bg-white/70'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        {/* Rich deep overlay — earth + night */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/92 via-amber-950/80 to-gray-900/90" />

        {/* Adinkra pattern overlay */}
        <div className="absolute inset-0 text-amber-400/30">
          <AdinkraPattern opacity={0.08} />
        </div>

        {/* Warm amber glow — top right */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-amber-500/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        {/* Cool blue glow — bottom left */}
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-blue-600/15 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-amber-400/30 backdrop-blur-sm px-4 py-1.5 text-sm text-amber-100 font-medium mb-8">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Trusted by thousands across Nigeria
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-2xl"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
          >
            Africa's skilled artisans,
            <br className="hidden sm:block" />
            <span className="text-amber-400">one platform away</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl font-semibold text-white max-w-2xl mx-auto leading-relaxed"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}
          >
            Connect with verified local craftspeople and service professionals.
            Post a job or showcase your skills — built for Nigerian communities.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/jobs">
              <Button
                size="lg"
                variant="primary"
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold shadow-xl shadow-amber-900/40 border-0"
              >
                <Search className="w-5 h-5" />
                Browse Available Jobs
              </Button>
            </Link>
            {!isAuthenticated ? (
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : user?.role === 'client' ? (
              <Link to="/jobs/create">
                <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm">
                  Post a Job <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/jobs">
                <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm">
                  Find Work <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Trust signals */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-bold text-white"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
          >
            {['No hidden fees', 'Verified providers', 'Secure payments', '24-hour support'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-900 border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center">
            {[
              { icon: <Briefcase className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/20', value: '1,200+', label: 'Jobs posted' },
              { icon: <Users     className="w-5 h-5 text-blue-400" />,  bg: 'bg-blue-500/20',  value: '500+',   label: 'Verified providers' },
              { icon: <Star      className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/20', value: '4.9/5',  label: 'Average rating' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <div className={`mx-auto w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-gray-950 overflow-hidden">
        {/* Kente-strip accent at top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-green-500 to-blue-600" />

        <div className="text-amber-400/20 absolute inset-0 pointer-events-none">
          <AdinkraPattern opacity={0.04} />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-amber-400 mb-3">Simple process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How SkillLink works</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">Three steps to get any skilled work done — quickly and safely</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Briefcase className="w-6 h-6 text-amber-400" />,
                border: 'border-amber-500/30',
                glow: 'bg-amber-500/10',
                title: 'Post your job',
                desc: 'Describe what you need, set your budget, and add your location. Takes under 2 minutes.',
              },
              {
                step: '02',
                icon: <Users className="w-6 h-6 text-blue-400" />,
                border: 'border-blue-500/30',
                glow: 'bg-blue-500/10',
                title: 'Receive bids',
                desc: 'Verified local artisans send their best offers. Compare prices, read reviews, pick the best.',
              },
              {
                step: '03',
                icon: <CheckCircle className="w-6 h-6 text-green-400" />,
                border: 'border-green-500/30',
                glow: 'bg-green-500/10',
                title: 'Get it done',
                desc: 'Work is completed, payment released, and you leave a review. Safe and straightforward.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative flex flex-col gap-5 p-7 rounded-2xl border ${item.border} bg-white/4 backdrop-blur-sm hover:bg-white/8 transition-colors duration-200`}
              >
                <div className={`w-14 h-14 rounded-2xl ${item.glow} border ${item.border} flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className="absolute top-5 right-6 text-5xl font-black text-white/5 select-none leading-none">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-amber-500" />
      </section>

      {/* ── Service categories ────────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="py-16 bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-1">Explore</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Browse by category</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(categories as string[]).map((cat) => (
                <Link
                  key={cat}
                  to={`/jobs?category=${encodeURIComponent(cat)}`}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-700 bg-gray-800 text-sm font-semibold text-gray-200 hover:border-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-150"
                >
                  <Wrench className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trades showcase ──────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-2">Our artisans</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Skills you can hire today</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto">
              From your car engine to your haircut — trusted professionals for every job
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {TRADES.map((trade) => (
              <Link
                key={trade.title}
                to={`/jobs?search=${encodeURIComponent(trade.title)}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] block"
              >
                {/* Trade photo */}
                <img
                  src={trade.url}
                  alt={trade.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Dark gradient over photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                {/* Trade label */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow">{trade.title}</p>
                  <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Browse jobs <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SkillLink ─────────────────────────────────────────────── */}
      <section className="relative py-20 bg-blue-950 overflow-hidden">
        <div className="absolute inset-0 text-blue-400/10 pointer-events-none">
          <AdinkraPattern opacity={0.06} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-1">Why us</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Built for Nigerian communities</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-blue-300" />,
                bg: 'bg-blue-500/20',
                title: 'Verified artisans',
                desc: 'Every provider goes through identity and skill verification before they can accept work.',
              },
              {
                icon: <Hammer className="w-6 h-6 text-amber-400" />,
                bg: 'bg-amber-500/20',
                title: 'Local expertise',
                desc: 'Find craftspeople who understand your neighbourhood, culture, and specific needs.',
              },
              {
                icon: <Zap className="w-6 h-6 text-green-400" />,
                bg: 'bg-green-500/20',
                title: 'Fast connections',
                desc: 'Real-time messaging and instant bid notifications so work starts faster.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-5 p-6 rounded-2xl bg-white/8 border border-white/10 hover:bg-white/12 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-base">{item.title}</h3>
                  <p className="text-sm text-blue-200 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent jobs ──────────────────────────────────────────────────── */}
      {jobs.length > 0 && (
        <section className="py-16 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-1">Live board</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Latest jobs</h2>
                <p className="text-sm text-gray-400 mt-1">What people need help with right now</p>
              </div>
              <Link
                to="/jobs"
                className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
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

      {/* ── Top providers ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-1">Featured</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Top providers</h2>
              <p className="text-sm text-gray-400 mt-1">Verified and highly rated professionals</p>
            </div>
            <Link
              to="/providers"
              className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
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

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-gray-950 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-green-500 to-blue-600" />
        <div className="text-amber-400/20 absolute inset-0 pointer-events-none">
          <AdinkraPattern opacity={0.06} />
        </div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] -translate-y-1/2 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-amber-400 block mb-4">Get started today</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Ready to get something done?
          </h2>
          <p className="mt-5 text-gray-400 text-lg max-w-xl mx-auto">
            Join thousands of clients and artisans already using SkillLink to do great work together.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=client">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold shadow-xl shadow-amber-900/40 border-0"
              >
                <Clock className="w-5 h-5" />
                Post a job — it's free
              </Button>
            </Link>
            <Link to="/register?role=provider">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border border-white/20">
                Offer your skills
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-green-500 to-amber-500" />
      </section>

    </div>
  );
}
