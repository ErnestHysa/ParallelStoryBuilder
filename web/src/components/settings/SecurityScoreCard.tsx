'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityScoreCardProps {
  score: number;
}

export function SecurityScoreCard({ score }: SecurityScoreCardProps) {
  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'emerald', icon: ShieldCheck };
    if (score >= 60) return { label: 'Good', color: 'blue', icon: ShieldCheck };
    if (score >= 40) return { label: 'Fair', color: 'amber', icon: ShieldAlert };
    return { label: 'Poor', color: 'red', icon: ShieldX };
  };

  const level = getSecurityLevel(score);
  const Icon = level.icon;

  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
  };

  const glowClasses = {
    emerald: 'shadow-emerald-500/30',
    blue: 'shadow-blue-500/30',
    amber: 'shadow-amber-500/30',
    red: 'shadow-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-xl',
        colorClasses[level.color as keyof typeof colorClasses],
        glowClasses[level.color as keyof typeof glowClasses]
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Security Score</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold tracking-tight">{score}%</span>
            <span className="text-xl font-medium text-white/90">{level.label}</span>
          </div>
        </div>

        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
        >
          <Icon className="w-10 h-10" strokeWidth={2} />
        </motion.div>
      </div>

      {/* Progress ring indicator */}
      <div className="absolute bottom-4 right-4">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="3"
          />
          <motion.path
            initial={{ strokeDasharray: `0, 100` }}
            animate={{ strokeDasharray: `${score}, 100` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
