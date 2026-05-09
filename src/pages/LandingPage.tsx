import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck, 
  Code2, 
  History, 
  Globe, 
  Terminal, 
  ArrowRight,
  Github,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-200">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-dark-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">FlowForge</span>
          </div>
          
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-medium hover:text-white transition-colors">Sign in</Link>
            <Link 
              to="/auth" 
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-200 transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute top-0 -z-10 h-full w-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
        
        <motion.div 
          className="text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-blue backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue"></span>
            </span>
            New: Postman Collection Import
          </motion.div>
          
          <motion.h1 
            variants={item}
            className="font-display text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl"
          >
            Test integrations <br />
            <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
              before production breaks.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={item}
            className="mx-auto mt-8 max-w-2xl text-lg text-neutral-400 sm:text-xl"
          >
            FlowForge helps developers validate APIs, webhooks, and integrations before connecting real systems. 
            The industrial-grade testing tool for modern engineering teams.
          </motion.p>
          
          <motion.div variants={item} className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link 
              to="/auth" 
              className="flex items-center gap-2 rounded-full bg-brand-blue px-8 py-4 font-semibold text-white hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Start Testing Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="https://github.com/mubambam383-gif/FlowForge" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white hover:bg-white/10 transition-all"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </a>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-24 grid w-full max-w-6xl place-items-center"
        >
          <div className="relative rounded-2xl border border-white/10 bg-dark-bg p-2 shadow-2xl overflow-hidden ring-1 ring-white/5">
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/10 via-transparent to-transparent opacity-50" />
             <img 
               src="https://images.unsplash.com/photo-1558494949-ef010cbdcc48?q=80&w=2074&auto=format&fit=crop" 
               alt="Dashboard Preview" 
               className="h-full w-full rounded-xl object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" 
             />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-white/20 bg-dark-bg/80 p-8 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <Terminal className="h-8 w-8 text-brand-blue" />
                    <div>
                      <div className="h-2 w-32 rounded bg-neutral-700" />
                      <div className="mt-2 h-2 w-24 rounded bg-neutral-800" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Integrations Saved', value: '50M+' },
              { label: 'Uptime Reliability', value: '99.99%' },
              { label: 'Developer Trust', value: '100k+' },
              { label: 'API Calls Tested', value: '1B+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white font-display mb-1">{stat.value}</div>
                <div className="text-sm text-neutral-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Everything you need <br /> to sync with confidence.</h2>
            <p className="mt-6 text-neutral-400">Professional tools built for elite engineering teams.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <FeatureCard 
               icon={<Globe className="h-6 w-6" />}
               title="Global Webhook Simulator"
               description="Test incoming webhooks from any service with dedicated replay URLs and payload inspection."
             />
             <FeatureCard 
               icon={<ShieldCheck className="h-6 w-6" />}
               title="Contract Validation"
               description="Automatically validate OpenAPI and Swagger specs against real traffic to detect breaking changes."
             />
             <FeatureCard 
               icon={<Code2 className="h-6 w-6" />}
               title="Mock API Generator"
               description="Instantly spin up mock endpoints based on your schemas to unblock frontend development."
             />
             <FeatureCard 
               icon={<History className="h-6 w-6" />}
               title="Request Timeline"
               description="Trace requests through your entire integration lifecycle with deep-dive logging and search."
             />
             <FeatureCard 
               icon={<Zap className="h-6 w-6" />}
               title="AI Diagnostics"
               description="Automatically identify the root cause of integration failures with AI-powered error analysis."
             />
             <FeatureCard 
               icon={<Terminal className="h-6 w-6" />}
               title="CI/CD Pipelines"
               description="Integrate validation into your existing workflows with our CLI and automation hooks."
             />
          </div>
        </div>
      </section>

      <section id="docs" className="border-y border-white/5 bg-white/[0.02] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-white">Documentation</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['API Testing', 'Create collections, send requests, validate schemas, and review logs.'],
              ['Webhook Lab', 'Copy your webhook URL, receive events, and replay payloads.'],
              ['Mock Servers', 'Create mock routes with custom status codes, JSON bodies, and latency.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-white/5 bg-black/30 p-5">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs text-neutral-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-brand-blue/20 bg-brand-blue/5 p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white">Developer Preview</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-400">Use the included Supabase and Vercel setup to run FlowForge for your team. Billing hooks are documented in settings and can be connected to Stripe when you are ready to monetize.</p>
          <Link to="/auth" className="mt-8 inline-flex rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white">Start now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              < Zap className="h-6 w-6 text-brand-blue" />
              <span className="font-display text-xl font-bold text-white">FlowForge</span>
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed">
              FlowForge is the next-generation integration infrastructure. 
              We're on a mission to eliminate integration errors worldwide.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-20 sm:grid-cols-3">
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/webhooks" className="hover:text-white transition-colors">Webhook Lab</Link></li>
                <li><Link to="/mock-servers" className="hover:text-white transition-colors">Mock Servers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><Link to="/api-testing" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><a href="#docs" className="hover:text-white transition-colors">About</a></li>
                <li><a href="mailto:privacy@flowforge.local" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="mailto:legal@flowforge.local" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-neutral-600">
          <p>© 2026 FlowForge Inc. All rights reserved.</p>
          <div className="flex gap-6">
             <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Twitter</a>
             <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-all duration-300">
      <div className="mb-6 rounded-xl bg-brand-blue/10 p-3 text-brand-blue inline-block group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-brand-blue transition-colors duration-300">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-sm">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-brand-blue text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
        Learn more <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
}
