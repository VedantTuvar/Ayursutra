import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import {
  Calendar,
  HeartPulse,
  Package,
  IndianRupee,
  BarChart3,
  Settings,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Users
} from 'lucide-react';

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Auto redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: Calendar,
      title: 'Conflict-Free Resource Scheduler',
      description:
        'Intelligent 3-way timing lock that reserves the Patient, therapist, and massage table simultaneously to avoid overlapping slot bookings.'
    },
    {
      icon: HeartPulse,
      title: 'Prakriti Dosha Calculators',
      description:
        'Interactive 20-question constitutional questionnaires mapping physical, mental, and physiological parameters to determine dominant humors.'
    },
    {
      icon: Package,
      title: 'Pharmacy Inventory Scanner',
      description:
        'Real-time oil and ghee volume tracking that automatically deducts stocks upon session completions and raises low-margin alerts.'
    },
    {
      icon: IndianRupee,
      title: 'GST-Compliant Billed Ledgers',
      description:
        'Automated line item calculations applying 18% CGST/SGST, flat discounts, custom payment logs, and downloadable PDF invoices.'
    },
    {
      icon: BarChart3,
      title: 'Executive Analytics Dashboards',
      description:
        'Clean, graphical Recharts-powered analytics mapping therapist occupancies, popular treatments, and monthly clinic revenue trends.'
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Tenant Scoping Lock',
      description:
        'Rigorous JWT session validation and row-level database tenant filters ensuring complete clinic data isolation.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background glowing emerald circular blobs */}
      <div className="absolute top-10 -left-48 w-[600px] h-[600px] bg-emerald-700/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-20 -right-48 w-[600px] h-[600px] bg-teal-800/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Header Navigation */}
      <header className="relative sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 h-16 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <span className="font-display font-extrabold text-xl bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
            AyurSutra
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/40">
            SaaS Workstation
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hidden sm:inline text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            Features
          </a>
          <a href="#architecture" className="hidden sm:inline text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            Architecture
          </a>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 rounded-xl transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Go to Workstation' : 'Launch Workstation'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-5xl mx-auto text-center space-y-8 z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-bold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Complete Panchakarma Clinic SaaS Platform</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-none text-white max-w-4xl">
          The Premium Panchakarma Workstation for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Modern Ayurvedic Clinics
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
          Intelligent multi-resource scheduling, Prakriti assessments, real-time oil inventory tracking, daily therapist logs, and automated GST-compliant invoicing.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 shrink-0">
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-700 hover:bg-brand-600 text-white font-bold text-sm shadow-xl shadow-brand-950/20 active:scale-[0.99] transition-all"
          >
            <span>Launch Clinical Workstation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 font-bold text-sm transition-all"
          >
            <span>Explore Platform Features</span>
          </a>
        </div>
      </section>

      {/* Grid Dashboard mockup card */}
      <section className="relative px-6 max-w-6xl mx-auto z-10 pb-20">
        <div className="relative rounded-3xl bg-slate-900/40 border border-slate-850 p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 font-display text-slate-300">ayursutra-workstation-mockup.png</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">localhost:5173/dashboard</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Active Therapist Skill-rosters</span>
              <p className="text-2xl font-bold font-display text-emerald-400 leading-tight">100% Certified</p>
              <span className="text-[10px] text-slate-450 font-medium block">Snehana, Swedana, Shirodhara, Basti</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Intelligent Scheduling</span>
              <p className="text-2xl font-bold font-display text-emerald-400 leading-tight">Conflict-Free Locks</p>
              <span className="text-[10px] text-slate-450 font-medium block">Patients + Rooms + Therapist simultaneous check</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Automated Billing</span>
              <p className="text-2xl font-bold font-display text-emerald-400 leading-tight">18% GST Calculations</p>
              <span className="text-[10px] text-slate-450 font-medium block">Automated invoicing on completed sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="relative bg-slate-950/40 border-y border-slate-900 py-20 px-6 z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">
              Platform Features Built Specially for Ayurvedic Clinics
            </h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              An all-in-one clinical workstation scaffolded end-to-end
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 p-6 rounded-2xl space-y-4 hover:shadow-xl hover:shadow-emerald-950/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-900/40">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-105">{feat.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Monorepo Architecture Tech stack */}
      <section id="architecture" className="relative py-20 px-6 z-10 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">
            Scaffolded on a Modern Full-Stack Architecture
          </h2>
          <p className="text-slate-450 text-xs font-semibold uppercase tracking-wider">
            High performance monorepo configured with npm workspaces
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-center font-semibold">
          <div className="bg-slate-900/40 border border-slate-850/60 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Core Layer</span>
            <p className="text-slate-200 font-bold text-sm">React 18 & Vite</p>
            <span className="text-[10px] text-slate-400 font-medium block">Frosted glass layout templates</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-850/60 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Backend API</span>
            <p className="text-slate-200 font-bold text-sm">Express & TypeScript</p>
            <span className="text-[10px] text-slate-400 font-medium block">Winston loggers, custom errors</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-850/60 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Database ORM</span>
            <p className="text-slate-200 font-bold text-sm">Prisma & PostgreSQL</p>
            <span className="text-[10px] text-slate-400 font-medium block">16 relational clinical schemas</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-850/60 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Cache & Sockets</span>
            <p className="text-slate-200 font-bold text-sm">Redis & Socket.io</p>
            <span className="text-[10px] text-slate-400 font-medium block">Real-time cache synchronization</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 AyurSutra Platform. Fully working monorepo scaffolded end-to-end.</p>
      </footer>
    </div>
  );
}
export default HomePage;
