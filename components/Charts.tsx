
import React from 'react';
import { Zap, Activity, ShieldAlert, Waves } from 'lucide-react';

interface ChartsProps {
  scores: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
}

const Charts: React.FC<ChartsProps> = ({ scores }) => {
  const items = [
    { label: 'Protein', value: scores.protein, unit: 'g', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Carbs', value: scores.carbs, unit: 'g', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Fats', value: scores.fats, unit: 'g', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Fiber', value: scores.fiber, unit: 'g', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="w-full space-y-4">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nutritional Breakdown</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.label} className={`${item.bg} p-4 rounded-2xl border border-white/5 flex flex-col gap-2`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
              <p className="text-xl font-black text-slate-100">{item.value}<span className="text-[10px] ml-1 text-slate-500">{item.unit}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charts;
