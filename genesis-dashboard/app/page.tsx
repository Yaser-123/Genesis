'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAgents } from '@/lib/api';
import { Agent } from '@/types/agent';
import {
  Users,
  CheckCircle2,
  Workflow,
  TrendingUp,
  Calendar,
  Bell,
  Search,
  BarChart3,
  Zap,
  ArrowRight,
  Globe,
  Database,
  FileText,
  Loader2,
  Skull,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: agents, error, isLoading } = useSWR<Agent[]>('/api/agents', fetchAgents, {
    refreshInterval: 3000,
  });

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const initialTick = window.setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      clearInterval(timer);
    };
  }, []);

  // Calculate stats safely
  const safeAgents = agents || [];
  const totalAgents = safeAgents.length;
  const aliveAgents = safeAgents.filter((a) => a.isAlive).length;
  const totalAda = safeAgents.reduce((sum, a) => sum + (a.adaBalance || 0), 0);
  const successRate = totalAgents > 0 ? ((aliveAgents / totalAgents) * 100).toFixed(1) : '0.0';

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Loading date';

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '--:-- --';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-sage/30">
      <main className="relative z-10 container mx-auto px-6 py-8 max-w-[1400px]">

        {/* ─── Welcome Header ─── */}
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, Saif{' '}
              <span className="inline-block animate-[wave_1.5s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Here&apos;s what&apos;s happening with your agents today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date & Time */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <span>{formattedDate}</span>
              </div>
              <div className="w-px h-4 bg-card-border" />
              <span className="text-sm text-text-primary font-mono">{formattedTime}</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm hover:border-card-border-hover transition-colors">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-pine rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* ─── Stat Cards ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {/* Total Agents */}
          <StatCard
            icon={<Users className="w-5 h-5" />}
            iconColor="text-text-secondary"
            iconBg="bg-sage/20 border-sage/30"
            value={isLoading ? '...' : totalAgents.toString()}
            label="Total Agents"
            subtitle="Active in system"
          />

          {/* Tasks Completed */}
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconColor="text-text-secondary"
            iconBg="bg-sage/20 border-sage/30"
            value={isLoading ? '...' : totalAda.toLocaleString()}
            label="Total ADA"
            subtitle={
              <span className="text-text-secondary text-xs">
                +{aliveAgents * 100} from active
              </span>
            }
          />

          {/* Active Workflows */}
          <StatCard
            icon={<Workflow className="w-5 h-5" />}
            iconColor="text-text-secondary"
            iconBg="bg-sage/20 border-sage/30"
            value={isLoading ? '...' : aliveAgents.toString()}
            label="Active Agents"
            subtitle="Running now"
          />

          {/* Success Rate */}
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            iconColor="text-text-secondary"
            iconBg="bg-sage/20 border-sage/30"
            value={isLoading ? '...' : `${successRate}%`}
            label="Success Rate"
            subtitle="Alive vs total"
          />
        </section>

        {/* ─── Agent Orchestration Section ─── */}
        <section className="mb-10 rounded-2xl border border-card-border bg-card-bg shadow-sm p-8 relative overflow-hidden">
          {/* Background subtle pattern */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(97, 135, 110, 0.1) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-10">
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-text-secondary">
              Agent Orchestration
            </h2>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 rounded-lg border border-white/15 text-sm font-medium text-text-primary hover:border-card-border-hover hover:text-white transition-all"
            >
              View Orchestration
            </button>
          </div>

          {/* Orchestration Diagram */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Main Flow Row */}
            <div className="flex items-center justify-center gap-0 w-full max-w-3xl">
              {/* Input Node */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl border border-sage/30 bg-sage/10 flex items-center justify-center animate-float">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </div>
              </div>

              {/* Connection line with dots */}
              <div className="flex items-center mx-2">
                <div className="w-8 h-px bg-gradient-to-r from-sage/20 to-sage/60" />
                <div className="w-2 h-2 rounded-full bg-sage" />
                <div className="w-4 h-px bg-sage/60" />
              </div>

              {/* Agent Orchestrator - Central Node */}
              <div className="relative">
                <div className="px-8 py-4 rounded-xl border border-pine/20 bg-pine/5 backdrop-blur-sm flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-pine/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-pine/40" />
                    <div className="w-2 h-2 rounded-full bg-pine/60" />
                  </div>
                  <span className="text-sm font-semibold text-pine tracking-wide">Agent Orchestrator</span>
                </div>

                {/* Dashed lines going down to sub-nodes */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-px h-8">
                  <svg width="2" height="32" className="overflow-visible">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="var(--color-sage)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>

                {/* Branching connector */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+32px)]">
                  <svg width="200" height="40" viewBox="-100 0 200 40" className="overflow-visible">
                    {/* Center diamond */}
                    <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="var(--color-sage)" stroke="var(--color-forest)" strokeWidth="1" />
                    {/* Left branch */}
                    <line x1="0" y1="7" x2="-80" y2="35" stroke="var(--color-sage)" strokeWidth="1" strokeDasharray="4 4" />
                    {/* Center branch */}
                    <line x1="0" y1="7" x2="0" y2="35" stroke="var(--color-sage)" strokeWidth="1" strokeDasharray="4 4" />
                    {/* Right branch */}
                    <line x1="0" y1="7" x2="80" y2="35" stroke="var(--color-sage)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>
              </div>

              {/* Connection line with dots */}
              <div className="flex items-center mx-2">
                <div className="w-4 h-px bg-sage/60" />
                <div className="w-2.5 h-2.5 rotate-45 bg-sage/60 border border-white/15" />
                <div className="w-4 h-px bg-sage/60" />
              </div>

              {/* AI Node */}
              <div className="w-16 h-16 rounded-xl border border-pine/20 bg-pine/5 flex items-center justify-center animate-float-delay-1">
                <span className="text-2xl font-black tracking-tighter" style={{ fontFamily: 'serif' }}>AI</span>
              </div>
            </div>

            {/* Sub-nodes Row */}
            <div className="flex items-center justify-center gap-12 mt-20">
              <div className="flex flex-col items-center gap-2 animate-float">
                <div className="w-12 h-12 rounded-full border border-sage/30 bg-sage/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Web</span>
              </div>

              <div className="flex flex-col items-center gap-2 animate-float-delay-1">
                <div className="w-12 h-12 rounded-full border border-sage/30 bg-sage/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Data</span>
              </div>

              <div className="flex flex-col items-center gap-2 animate-float-delay-2">
                <div className="w-12 h-12 rounded-full border border-sage/30 bg-sage/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-text-secondary" />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Docs</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Chat / Help Section ─── */}
        <section className="rounded-2xl border border-card-border bg-card-bg shadow-sm p-8">
          <h3 className="text-lg font-bold text-foreground mb-4">What can I help with?</h3>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Execute multi-agent workflows, coordinate tasks, and get intelligent results."
                className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-card-bg shadow-sm text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <PillButton icon={<Search className="w-3.5 h-3.5" />} label="Search" />
              <PillButton icon={<BarChart3 className="w-3.5 h-3.5" />} label="Analyze" />
              <PillButton icon={<Zap className="w-3.5 h-3.5" />} label="Automate" />
            </div>
            <button className="w-10 h-10 rounded-xl border-transparent bg-pine flex items-center justify-center hover:bg-pine/90 transition-colors">
              <ArrowRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </section>

        {/* ─── Error State ─── */}
        {error && (
          <div className="mt-10 flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-card-border bg-card-bg shadow-sm">
            <div className="p-4 rounded-full border-sage/50 bg-sage/10">
              <Skull className="w-8 h-8 text-text-secondary" />
            </div>
            <p className="text-text-primary font-medium text-lg">Connection Terminated</p>
            <p className="text-sm text-text-muted">
              Failed to fetch agent data. Verify the core backend is online on port 4000.
            </p>
          </div>
        )}

        {/* ─── Agent Grid (below orchestration) ─── */}
        {!error && !isLoading && safeAgents.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-text-secondary">
                Active Agents
              </h2>
              <div className="flex items-center gap-2 text-xs text-text-secondary px-3 py-1.5 rounded-full border border-card-border bg-card-bg shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-pine animate-pulse" />
                Live Sync
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="group relative rounded-xl border border-card-border bg-card-bg shadow-sm p-5 cursor-pointer hover:border-card-border-hover transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm">{agent.name}</h3>
                    <span className={`flex items-center gap-1.5 text-xs ${agent.isAlive ? 'text-text-secondary' : 'text-text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.isAlive ? 'bg-pine/60' : 'bg-text-muted'}`} />
                      {agent.isAlive ? 'Alive' : 'Dead'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1 mb-3">{agent.goal}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{agent.personality}</span>
                    <span className="font-mono text-text-secondary">{agent.adaBalance.toLocaleString()} ADA</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-10 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Stat Card Component ─── */
function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-card-border bg-card-bg shadow-sm p-5 hover:border-card-border-hover transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-lg border ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground font-mono tracking-tight mb-1">{value}</div>
      <div className="text-sm font-medium text-text-secondary">{label}</div>
      <div className="text-xs text-text-muted mt-0.5">{typeof subtitle === 'string' ? subtitle : subtitle}</div>
    </div>
  );
}

/* ─── Pill Button Component ─── */
function PillButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-card-border bg-card-bg shadow-sm text-xs text-text-secondary hover:border-card-border-hover hover:text-text-primary transition-all">
      {icon}
      {label}
    </button>
  );
}
