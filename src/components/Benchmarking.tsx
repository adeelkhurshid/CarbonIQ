import React, { useMemo } from 'react';
import {
  TrendingUp,
  Globe,
  Building2,
  Users,
  ShieldCheck,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { CompanyProfile, CalculationRecord, BenchmarkData } from '../shared/types';

interface BenchmarkingProps {
  company: CompanyProfile;
  calculations: CalculationRecord[];
  benchmarks: BenchmarkData[];
}

export default function Benchmarking({ company, calculations, benchmarks }: BenchmarkingProps) {
  // Current footprint calculate
  const totalEmissions = useMemo(() => {
    return calculations.reduce((acc, r) => acc + r.calculatedCo2e, 0);
  }, [calculations]);

  // Current intensities
  const currentIntensities = useMemo(() => {
    const revenueInt = company.revenue > 0 ? totalEmissions / company.revenue : 0;
    const employeeInt = company.employeeCount > 0 ? totalEmissions / company.employeeCount : 0;
    return { revenueInt, employeeInt };
  }, [totalEmissions, company]);

  // Get matching industry peer benchmarks
  const sectorBenchmark = useMemo(() => {
    return benchmarks.find((b) => b.industry.toLowerCase() === company.industry.toLowerCase()) || {
      industry: company.industry,
      averageIntensity: 0.15,
      revenueIntensity: 5.2,
      country: company.country
    };
  }, [benchmarks, company.industry]);

  // Prepare peer list for comparison plot
  const chartData = useMemo(() => {
    return benchmarks.map((b) => {
      const isCurrent = b.industry.toLowerCase() === company.industry.toLowerCase();
      return {
        name: b.industry,
        'Revenue Intensity (t/$M)': b.revenueIntensity,
        'Atlas (This Company)': isCurrent ? Number(currentIntensities.revenueInt.toFixed(2)) : 0,
        isCurrent
      };
    });
  }, [benchmarks, currentIntensities, company.industry]);

  const ratingStatus = useMemo(() => {
    const current = currentIntensities.revenueInt;
    const peer = sectorBenchmark.revenueIntensity;
    if (current === 0) return { label: 'Incomplete', color: 'text-slate-400 bg-slate-900 border-slate-800' };

    const diff = ((current - peer) / peer) * 100;
    if (diff < -20) {
      return {
        label: 'A-Class Leader',
        desc: `Your operations emit ${Math.abs(Math.round(diff))}% less than peers in ${company.industry}. Perfect regulatory positioning!`,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    } else if (diff <= 10) {
      return {
        label: 'B-Class Aligned',
        desc: `Your emissions intensity matches standard peer boundaries (+/- 10%) for ${company.industry}. Keep reducing.`,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      };
    } else {
      return {
        label: 'Carbon Intensity Warning',
        desc: `Intensity is ${Math.round(diff)}% higher than averages for ${company.industry}. Transition to clean renewables to optimize.`,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      };
    }
  }, [currentIntensities, sectorBenchmark, company.industry]);

  return (
    <div id="esg_benchmarks_module" className="space-y-6">
      {/* Header Panel */}
      <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-1.5 font-mono">
          <Award className="w-5 h-5 text-emerald-400" /> Peer ESG Benchmarking
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Evaluate carbon intensive metrics against official secondary peer databases (eGRID, DEFRA corporate indexes) for {company.country}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATS MATRIX SECTION */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-6">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Carbon intensity audit</h3>

          <div className="space-y-4">
            {/* 1. Revenue comparison */}
            <div className="p-4 bg-[#050505] border border-white/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-semibold block">Emissions per $M Revenue</span>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-white/40">Atlas Group</div>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{currentIntensities.revenueInt.toFixed(2)} <span className="text-[10px] text-white/30">t/$M</span></div>
                </div>
                <div className="text-right border-l border-white/5 pl-3">
                  <div className="text-xs text-white/40">{company.industry} peer</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{sectorBenchmark.revenueIntensity.toFixed(1)} <span className="text-[10px] text-cyan-500/50">t/$M</span></div>
                </div>
              </div>
            </div>

            {/* 2. Employee size comparison */}
            <div className="p-4 bg-[#050505] border border-white/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-semibold block">Emissions per Employee</span>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-white/40">Atlas head count</div>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">{currentIntensities.employeeInt.toFixed(2)} <span className="text-[10px] text-white/30">t/head</span></div>
                </div>
                <div className="text-right border-l border-white/5 pl-3">
                  <div className="text-xs text-white/40">{company.industry} peer</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{sectorBenchmark.averageIntensity.toFixed(2)} <span className="text-[10px] text-emerald-500/50">t/head</span></div>
                </div>
              </div>
            </div>

            {/* Diagnostic Alert Card */}
            {currentIntensities.revenueInt > 0 ? (
              <div className={`p-4 border rounded-xl space-y-1.5 ${ratingStatus.color}`}>
                <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> {ratingStatus.label}
                </div>
                <p className="text-[10.5px] leading-relaxed">{ratingStatus.desc}</p>
              </div>
            ) : (
              <div className="p-4 border border-white/5 rounded-xl bg-[#050505] text-white/30 text-[10.5px] leading-relaxed font-mono flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                <span>Diagnostics will execute once you load active emissions under Calculations ledger.</span>
              </div>
            )}
          </div>
        </div>

        {/* COMPARATIVE GRAPHS GRAPHIC PANEL */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <Globe className="w-4.5 h-4.5 text-cyan-500" /> Sector Intensity Matrix Comparison
            </h3>
            <p className="text-[11px] text-white/40 mb-6">Peer database distribution of tCO2e per $Million revenue in {company.country}</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={9} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={9.5} width={110} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="Revenue Intensity (t/$M)" fill="#1e293b">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? '#10b981' : '#1A1A1A'}
                      stroke={entry.isCurrent ? '#34d399' : 'rgba(255,255,255,0.05)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-[#050505] border border-white/10 rounded-xl flex items-center justify-between text-[10px] text-white/40 font-mono mt-4">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded inline-block"></span> Atlas Group (Current)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#1A1A1A] border border-white/5 rounded inline-block"></span> US Industry Peer Average</span>
          </div>
        </div>
      </div>
    </div>
  );
}
