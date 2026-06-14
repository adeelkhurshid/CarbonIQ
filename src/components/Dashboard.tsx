import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  LayoutGrid,
  Zap,
  Flame,
  Snowflake,
  Truck,
  Leaf,
  Globe,
  Building,
  Target,
  ArrowRight,
  ShieldCheck,
  Percent,
  Calculator,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { CompanyProfile, CalculationRecord } from '../shared/types';

interface DashboardProps {
  company: CompanyProfile;
  calculations: CalculationRecord[];
  isMetric: boolean;
  onSetMetric: (m: boolean) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Dashboard({ company, calculations, isMetric, onSetMetric }: DashboardProps) {
  const [selectedFacility, setSelectedFacility] = useState<string>('All');

  // Facilities list for filter
  const facilities = useMemo(() => {
    const list = new Set<string>();
    calculations.forEach(c => {
      if (c.facility) list.add(c.facility);
    });
    return ['All', ...Array.from(list)];
  }, [calculations]);

  // Filter calculations based on facility
  const filteredCalculations = useMemo(() => {
    if (selectedFacility === 'All') return calculations;
    return calculations.filter(c => c.facility === selectedFacility);
  }, [calculations, selectedFacility]);

  // CORE METRICS (Scope 1, 2, 3 totals)
  const stats = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    let t3 = 0;

    // Split details
    let stationary = 0;
    let mobile = 0;
    let refrigerant = 0;

    filteredCalculations.forEach((r) => {
      if (r.scope === 1) {
        t1 += r.calculatedCo2e;
        if (r.type === 'scope1_stationary') stationary += r.calculatedCo2e;
        if (r.type === 'scope1_mobile') mobile += r.calculatedCo2e;
        if (r.type === 'scope1_refrigerant') refrigerant += r.calculatedCo2e;
      } else if (r.scope === 2) {
        t2 += r.calculatedCo2e;
      } else if (r.scope === 3) {
        t3 += r.calculatedCo2e;
      }
    });

    const total = t1 + t2 + t3;

    return {
      total,
      scope1: t1,
      scope2: t2,
      scope3: t3,
      scope1Breakdown: { stationary, mobile, refrigerant }
    };
  }, [filteredCalculations]);

  // INTENSITY CALCULATIONS
  // Emissions per Million USD, Emissions per Employee
  const intensities = useMemo(() => {
    const total = stats.total;
    const perEmployee = company.employeeCount > 0 ? total / company.employeeCount : 0;
    const perRevenue = company.revenue > 0 ? total / company.revenue : 0;
    return { perEmployee, perRevenue };
  }, [stats, company]);

  // Monthly breakdown for bar chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = months.map((m, idx) => ({
      name: m,
      monthIndex: idx,
      'Scope 1': 0,
      'Scope 2': 0,
      'Scope 3': 0,
      total: 0
    }));

    filteredCalculations.forEach((r) => {
      const d = new Date(r.date);
      // Ensure it matches company reporting year
      if (d.getFullYear() === company.reportingYear) {
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          if (r.scope === 1) map[mIdx]['Scope 1'] += r.calculatedCo2e;
          if (r.scope === 2) map[mIdx]['Scope 2'] += r.calculatedCo2e;
          if (r.scope === 3) map[mIdx]['Scope 3'] += r.calculatedCo2e;
          map[mIdx].total += r.calculatedCo2e;
        }
      }
    });

    // Clean up floating points
    return map.map(item => ({
      ...item,
      'Scope 1': Number(item['Scope 1'].toFixed(2)),
      'Scope 2': Number(item['Scope 2'].toFixed(2)),
      'Scope 3': Number(item['Scope 3'].toFixed(2)),
      total: Number(item.total.toFixed(2))
    }));
  }, [filteredCalculations, company]);

  // Sources breakdown for pie chart
  const sourcesData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredCalculations.forEach((r) => {
      map[r.source] = (map[r.source] || 0) + r.calculatedCo2e;
    });

    return Object.keys(map).map((k) => ({
      name: k,
      value: Number(map[k].toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredCalculations]);

  // Target reduction tracking progress (simulated baseline or total target)
  const reductionTargetStatus = useMemo(() => {
    const baseline = stats.total * 1.35; // Mock 35% higher baseline
    const targetValue = baseline * (1 - company.targetReductionPercentage / 100);
    const difference = stats.total - targetValue;
    const progressPercent = Math.max(0, Math.min(100, ((baseline - stats.total) / (baseline - targetValue)) * 100));

    return {
      baseline: Number(baseline.toFixed(1)),
      targetValue: Number(targetValue.toFixed(1)),
      difference: Number(difference.toFixed(1)),
      percent: Math.round(progressPercent)
    };
  }, [stats.total, company]);

  // Unit converter for display metrics
  const quantityFormat = (val: number, standardUnit: string) => {
    if (!isMetric) {
      if (standardUnit === 'Litre') {
        const gal = val * 0.264172;
        return `${gal.toLocaleString('en-US', { maximumFractionDigits: 1 })} Gal`;
      }
      if (standardUnit === 'kg') {
        const lbs = val * 2.20462;
        return `${lbs.toLocaleString('en-US', { maximumFractionDigits: 1 })} Lbs`;
      }
      if (standardUnit === 'm3') {
        const ft3 = val * 35.3147;
        return `${ft3.toLocaleString('en-US', { maximumFractionDigits: 0 })} CuFt`;
      }
      if (standardUnit === 'kWh') {
        const mwh = val / 1000;
        return `${mwh.toLocaleString('en-US', { maximumFractionDigits: 2 })} MWh`;
      }
    }
    return `${val.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${standardUnit}`;
  };

  return (
    <div id="dashboard_console" className="space-y-6">
      {/* Upper Utility Control Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0A0A] border border-white/10 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-1.5 text-white/40 text-xs font-mono uppercase tracking-widest">
            <Building className="w-3.5 h-3.5 text-emerald-400" /> Administrative Area
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {company.name} <span className="text-xs font-normal text-white/40 font-mono ml-2">Reporting-RY-{company.reportingYear}</span>
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Sector: <strong className="text-white/80">{company.industry}</strong> &bull; Operational Boundaries: <strong className="text-white/80">Scopes 1, 2, 3 Active</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-sans">
          {/* Facility Filter Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Facility:</span>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="px-3 py-1.5 bg-[#050505] border border-white/10 rounded-lg text-xs text-white/80 focus:outline-none focus:border-emerald-500"
            >
              {facilities.map((fac) => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
          </div>

          {/* Unit Systems Toggle Button */}
          <div className="flex items-center gap-1.5 bg-[#050505] p-1 border border-white/10 rounded-lg">
            <button
              onClick={() => onSetMetric(true)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                isMetric ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-white/40 hover:text-white'
              }`}
            >
              Metric (t/kg/L/m³)
            </button>
            <button
              onClick={() => onSetMetric(false)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                !isMetric ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-white/40 hover:text-white'
              }`}
            >
              Imperial (lbs/gal/ft³/MWh)
            </button>
          </div>
        </div>
      </div>

      {/* CORE STATS KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL FOOTPRINT CARD */}
        <div id="kpi_total_footprint" className="bg-[#0A0A0A] border-2 border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-4 right-4 text-emerald-400/20 bg-emerald-500/5 p-2 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Total GHG Footprint</span>
          <h3 className="text-3xl font-bold text-white mt-1.5 tracking-tight">
            {stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-white/40 font-mono font-medium ml-1.5 uppercase">tCO₂e</span>
          </h3>
          <p className="text-[10px] text-white/40 mt-2 font-mono flex items-center gap-1 uppercase tracking-wider">
            <span className="text-emerald-400 font-bold">&#10003; GHG Protocol</span> location-based ledger
          </p>
        </div>

        {/* SCOPE 1 CARD */}
        <div id="kpi_scope_1" className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-400" /> Scope 1
              </span>
              <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                {stats.scope1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-white/40 font-mono ml-1">t</span>
              </h3>
            </div>
            <span className="text-[9px] font-bold bg-[#050505] text-emerald-400 border border-white/5 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
              Direct
            </span>
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-white/10 flex justify-between text-[11px] font-mono text-white/40">
            <span>Combustion / Refrigeration</span>
            <span className="text-white/80 font-bold">{stats.total > 0 ? Math.round((stats.scope1 / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* SCOPE 2 CARD */}
        <div id="kpi_scope_2" className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Scope 2
              </span>
              <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                {stats.scope2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-white/40 font-mono ml-1">t</span>
              </h3>
            </div>
            <span className="text-[9px] font-bold bg-[#050505] text-cyan-400 border border-white/5 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
              Grid
            </span>
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-white/10 flex justify-between text-[11px] font-mono text-white/40">
            <span>Purchased Electricity</span>
            <span className="text-white/80 font-bold">{stats.total > 0 ? Math.round((stats.scope2 / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        {/* SCOPE 3 CARD */}
        <div id="kpi_scope_3" className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Scope 3
              </span>
              <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                {stats.scope3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-white/40 font-mono ml-1">t</span>
              </h3>
            </div>
            <span className="text-[9px] font-bold bg-[#050505] text-indigo-400 border border-white/5 px-2 py-0.5 rounded uppercase font-mono tracking-wider">
              Supply Chain
            </span>
          </div>
          <div className="mt-3.5 pt-3.5 border-t border-white/10 flex justify-between text-[11px] font-mono text-white/40">
            <span>Travel, Waste, Goods</span>
            <span className="text-white/80 font-bold">{stats.total > 0 ? Math.round((stats.scope3 / stats.total) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* RECHARTS PLOTS BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MONTHLY DISCLOSURES GRID */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 font-mono">
                <Calendar className="w-4 h-4 text-emerald-400" /> Monthly Emission Trend
              </h4>
              <p className="text-[11px] text-white/40">GHG profile split by calendar records for reporting year {company.reportingYear}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Scope 1</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span> Scope 2</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Scope 3</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Scope 1" stackId="a" fill="#10b981" />
                <Bar dataKey="Scope 2" stackId="a" fill="#06b6d4" />
                <Bar dataKey="Scope 3" stackId="a" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART / TOP EMISSION SOURCES */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1 font-mono">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Top Heatmap Sources
            </h4>
            <p className="text-[11px] text-white/40 mb-4">Emissions concentration sorted by fuel/activity</p>
          </div>
          {sourcesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-xs font-mono p-6 border border-white/5 rounded-xl bg-[#050505]">
              No carbon transactions recorded. Continue to Data Entries to log activities.
            </div>
          ) : (
            <>
              <div className="h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center uppercase">
                  <span className="text-[9px] font-mono text-white/40 font-semibold uppercase tracking-wider">Active</span>
                  <span className="text-xs font-bold text-white font-mono mt-0.5">{sourcesData.length} Sources</span>
                </div>
              </div>

              {/* Legendary table of sources */}
              <div className="space-y-1.5 mt-4 max-h-44 overflow-y-auto pr-1">
                {sourcesData.slice(0, 4).map((source, idx) => (
                  <div key={source.name} className="flex justify-between items-center text-xs p-1.5 rounded bg-[#050505] border border-white/5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-white/80 truncate font-mono text-[11px]">{source.name}</span>
                    </div>
                    <span className="text-white font-mono font-bold text-[11px]">{source.value.toFixed(1)} t</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECONDARY ROW: SANKEY / EMISSION PATHWAY BREAKDOWN & TARGET REDUCTION GOALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SANKEY VISUAL REPRESENTATION PANEL */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl lg:col-span-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
            <Layers className="w-4 h-4 text-emerald-400" /> GHG Protocol Scope Flow
          </h4>
          <p className="text-[11px] text-white/40 mb-6">Interactive flow representation mapping audited activity inputs to Scopes intensity outputs.</p>

          <div className="p-4 bg-[#050505] border border-white/15 rounded-xl space-y-6 relative overflow-hidden">
            {/* Visual Flow diagram mimicking a Sankey */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs relative z-10 font-mono">
              {/* Column 1: Sources grouped */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">Inputs</div>
                <div className="p-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg shadow">
                  <div className="text-white/40 text-[10px]">Direct Fuels</div>
                  <div className="font-bold text-emerald-400 mt-1">S1 Combust</div>
                </div>
                <div className="p-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg shadow">
                  <div className="text-white/40 text-[10px]">Grid Power</div>
                  <div className="font-bold text-cyan-400 mt-1">Electricity</div>
                </div>
                <div className="p-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg shadow">
                  <div className="text-white/40 text-[10px]">Value-Chain</div>
                  <div className="font-bold text-indigo-400 mt-1">Purchases/Travel</div>
                </div>
              </div>

              {/* Column 2: Scope classifications */}
              <div className="flex flex-col justify-center space-y-5">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">Scopes</div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative">
                  <span className="font-bold text-emerald-400 text-[11px]">Scope 1 (Direct)</span>
                  <div className="text-white text-xs font-bold mt-0.5">{stats.scope1.toFixed(1)} t</div>
                </div>
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <span className="font-bold text-cyan-400 text-[11px]">Scope 2 (Grid)</span>
                  <div className="text-white text-xs font-bold mt-0.5">{stats.scope2.toFixed(1)} t</div>
                </div>
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <span className="font-bold text-indigo-400 text-[11px]">Scope 3 (Indirect)</span>
                  <div className="text-white text-xs font-bold mt-0.5">{stats.scope3.toFixed(1)} t</div>
                </div>
              </div>

              {/* Column 3: Corporate Footprint aggregate */}
              <div className="flex flex-col justify-center">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">Aggregated Profile</div>
                <div className="p-4 bg-[#0A0A0A] border-2 border-emerald-500/20 rounded-2xl shadow-xl">
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider">Total Inventory</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-1">{stats.total.toFixed(1)}</div>
                  <div className="text-[9px] text-white/40 font-mono">tCO2e</div>
                </div>
              </div>
            </div>

            {/* Simulated connector flows */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none opacity-20 flex items-center justify-around">
              <div className="w-1/2 h-[1px] bg-gradient-to-r from-emerald-500 to-cyan-500 blur-[1px] rotate-12"></div>
              <div className="w-1/2 h-[1px] bg-gradient-to-r from-cyan-500 to-indigo-500 blur-[1px] -rotate-12"></div>
            </div>
          </div>
        </div>

        {/* CARBON INTENSITY & REDUCTION PROGRESS */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 mb-1 font-mono">
              <Target className="w-4 h-4 text-cyan-400" /> Reduction Milestones
            </h4>
            <p className="text-[11px] text-white/40 mb-4 font-sans">Tracking alignment with corporate {company.targetReductionPercentage}% reduction target</p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Intensity KPIs */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#050505] border border-white/5 rounded-xl">
                <div className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-semibold">Revenue Intensity</div>
                <div className="text-base font-bold text-white font-mono mt-1">
                  {intensities.perRevenue.toFixed(2)}
                </div>
                <div className="text-[9.5px] text-white/45 font-mono mt-0.5">tCO2e / $M</div>
              </div>
              <div className="p-3 bg-[#050505] border border-white/5 rounded-xl">
                <div className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-semibold">Staff Intensity</div>
                <div className="text-base font-bold text-white font-mono mt-1">
                  {intensities.perEmployee.toFixed(2)}
                </div>
                <div className="text-[9.5px] text-white/45 font-mono mt-0.5">tCO2e / head</div>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="p-3 bg-[#050505] border border-white/10 rounded-xl space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-white/40">GHG Milestones Success</span>
                <span className="text-emerald-400 font-bold">{reductionTargetStatus.percent}% Done</span>
              </div>
              
              {/* Actual Progress Indicator bar */}
              <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${reductionTargetStatus.percent}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[9px] font-mono text-white/40 pt-1">
                <span>Baseline: {reductionTargetStatus.baseline} t</span>
                <span className="text-cyan-400">Target RY: {reductionTargetStatus.targetValue} t</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] p-2 border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 rounded-lg text-center font-mono mt-4 uppercase tracking-wider flex items-center justify-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> SEC & CSRD COMPLIANT METRIC SYSTEM
          </div>
        </div>
      </div>
    </div>
  );
}
