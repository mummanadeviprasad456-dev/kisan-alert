import type { ReactNode } from 'react';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  emerald: {
    bg: 'from-emerald-500/15 to-emerald-600/5',
    border: 'border-emerald-500/15',
    icon: 'bg-emerald-500/15 text-emerald-400',
    text: 'text-emerald-300',
    shadow: 'shadow-emerald-500/5',
  },
  blue: {
    bg: 'from-blue-500/15 to-blue-600/5',
    border: 'border-blue-500/15',
    icon: 'bg-blue-500/15 text-blue-400',
    text: 'text-blue-300',
    shadow: 'shadow-blue-500/5',
  },
  amber: {
    bg: 'from-amber-500/15 to-amber-600/5',
    border: 'border-amber-500/15',
    icon: 'bg-amber-500/15 text-amber-400',
    text: 'text-amber-300',
    shadow: 'shadow-amber-500/5',
  },
  red: {
    bg: 'from-red-500/15 to-red-600/5',
    border: 'border-red-500/15',
    icon: 'bg-red-500/15 text-red-400',
    text: 'text-red-300',
    shadow: 'shadow-red-500/5',
  },
  purple: {
    bg: 'from-purple-500/15 to-purple-600/5',
    border: 'border-purple-500/15',
    icon: 'bg-purple-500/15 text-purple-400',
    text: 'text-purple-300',
    shadow: 'shadow-purple-500/5',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, trendValue, color = 'emerald' }) => {
  const c = colorMap[color];

  return (
    <div
      className={`relative bg-gradient-to-br ${c.bg} rounded-2xl border ${c.border} p-5 shadow-xl ${c.shadow} hover:scale-[1.02] transition-transform duration-300 overflow-hidden`}
    >
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/[0.02] rounded-full" />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.icon}`}>{icon}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400'
                : trend === 'down'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-gray-500/10 text-gray-400'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
            {trendValue}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
    </div>
  );
};

export default StatsCard;
