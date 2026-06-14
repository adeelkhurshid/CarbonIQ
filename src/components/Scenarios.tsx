import React, { useState, useMemo } from 'react';
import {
  Sliders,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  TreePine,
  Car,
  DollarSign,
  Undo2,
  Save,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { CompanyProfile, CalculationRecord, ReductionScenario } from '../shared/types';

interface ScenariosProps {
  company: CompanyProfile;
  calculations: CalculationRecord[];
  onSaveScenario: (scenario: any) => Promise<void>;
  savedScenarios: ReductionScenario[];
}

export default function Scenarios({ company, calculations, onSaveScenario, savedScenarios }: ScenariosProps) {
  // Simulator Sliders State
  const [name, setName] = useState('Pathway Zero 2030');
  const [renewablePercent, setRenewablePercent] = useState(0); // Scope 2 offset
  const [fleetElectricPercent, setFleetElectricPercent] = useState(0); // Scope 1 mobile offset
  const [travelReductionPercent, setTravelReductionPercent] = useState(0); // Scope 3 business travel offset
  const [energyEfficiencyPercent, setEnergyEfficiencyPercent] = useState(0); // General Scope 1 & 2 offset

  const [savingLoading, setSavingLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Extract baseline emissions grouping
  const baselines = useMemo(() => {
    let scope1_stat = 0;
    let scope1_mob = 0;
    let scope1_ref = 0;
    let scope2 = 0;
    let scope3 = 0;

    calculations.forEach((r) => {
      if (r.scope === 1) {
        if (r.type === 'scope1_stationary') scope1_stat += r.calculatedCo2e;
        if (r.type === 'scope1_mobile') scope1_mob += r.calculatedCo2e;
        if (r.type === 'scope1_refrigerant') scope1_ref += r.calculatedCo2e;
      } else if (r.scope === 2) {
        scope2 += r.calculatedCo2e;
      } else if (r.scope === 3) {
        scope3 += r.calculatedCo2e;
      }
    });

    return {
      scope1_stat,
      scope1_mob,
      scope1_ref,
      scope2,
      scope3,
      total: scope1_stat + scope1_mob + scope1_ref + scope2 + scope3
    };
  }, [calculations]);

  // Perform dynamic simulations based on sliders mathematically
  const simulated = useMemo(() => {
    // 1. Energy Efficiency affects Stationary Heating (Scope 1) and Electricity (Scope 2)
    const efficiencyFactor = 1 - energyEfficiencyPercent / 100;
    const simStationary = baselines.scope1_stat * efficiencyFactor;
    let simElectricity = baselines.scope2 * efficiencyFactor;

    // 2. Renewable Energy offsets the remaining electricity (Scope 2) by the slider percentage
    simElectricity = simElectricity * (1 - renewablePercent / 100);

    // 3. Fleet Electrification offsets mobile vehicles fuel emissions (Scope 1)
    // When combustions vehicles are replaced by EVs, mobile fuel emissions drop by 100% of EV portion
    // but electricity load increases under Scope 2 by roughly 25% of the offset energy weight.
    const fuelOffset = baselines.scope1_mob * (fleetElectricPercent / 100);
    const simMobile = baselines.scope1_mob - fuelOffset;
    
    // Grid electricity increase of EV:
    const evElectricityBackload = fuelOffset * 0.25;
    // Apply renewable percentage offset even to the backload!
    const effectiveEvBackload = evElectricityBackload * (1 - renewablePercent / 100);
    const finalSimElectricity = simElectricity + effectiveEvBackload;

    // 4. Travel reduction affects Scope 3 supply travel elements directly
    const simScope3 = baselines.scope3 * (1 - travelReductionPercent / 100);

    // Refrigerants escaping remains constant in simulation
    const simRefrigerant = baselines.scope1_ref;

    // Totals summation
    const simScope1Total = simStationary + simMobile + simRefrigerant;
    const simTotal = simScope1Total + finalSimElectricity + simScope3;

    // Savings
    const totalSaved = Math.max(0, baselines.total - simTotal);
    const percentSaved = baselines.total > 0 ? (totalSaved / baselines.total) * 100 : 0;

    // Peer financial savings (approx $135 saved in utility margins/petrol purchases per ton CO2e reduced)
    const financialSavings = totalSaved * 135;

    // Ecological equivalents
    // 1 mature trees plants absorb ~22 kg (0.022 tonnes) of CO2 per year
    const treesEquivalent = Math.round(totalSaved / 0.022);
    // 1 average passenger car emits ~4.6 tonnes of CO2 per year
    const carsEquivalent = Number((totalSaved / 4.6).toFixed(1));

    return {
      scope1: simScope1Total,
      scope2: finalSimElectricity,
      scope3: simScope3,
      total: simTotal,
      totalSaved,
      percentSaved,
      financialSavings,
      equivalencies: {
        trees: treesEquivalent,
        cars: carsEquivalent
      }
    };
  }, [baselines, energyEfficiencyPercent, renewablePercent, fleetElectricPercent, travelReductionPercent]);

  // Chart data preparing Current vs Simulated
  const comparisonChartData = useMemo(() => {
    return [
      {
        name: 'Scope 1 (Direct)',
        Current: Number((baselines.scope1_stat + baselines.scope1_mob + baselines.scope1_ref).toFixed(1)),
        Simulated: Number(simulated.scope1.toFixed(1))
      },
      {
        name: 'Scope 2 (Indirect Grid)',
        Current: Number(baselines.scope2.toFixed(1)),
        Simulated: Number(simulated.scope2.toFixed(1))
      },
      {
        name: 'Scope 3 (Value Chain)',
        Current: Number(baselines.scope3.toFixed(1)),
        Simulated: Number(simulated.scope3.toFixed(1))
      }
    ];
  }, [baselines, simulated]);

  const handleResetSliders = () => {
    setRenewablePercent(0);
    setFleetElectricPercent(0);
    setTravelReductionPercent(0);
    setEnergyEfficiencyPercent(0);
    setSuccess('');
  };

  const handleApplyPreset = (scenario: ReductionScenario) => {
    setName(scenario.name);
    setRenewablePercent(scenario.renewablePercent);
    setFleetElectricPercent(scenario.fleetElectricPercent);
    setTravelReductionPercent(scenario.travelReductionPercent);
    setEnergyEfficiencyPercent(scenario.energyEfficiencyPercent);
    setSuccess(`Loaded simulation pathway: "${scenario.name}"`);
  };

  const handleSaveSimulatedPathway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingLoading(true);
    setSuccess('');
    try {
      await onSaveScenario({
        name,
        renewablePercent,
        fleetElectricPercent,
        travelReductionPercent,
        energyEfficiencyPercent,
        companyId: company.id
      });
      setSuccess(`Decarbonization pathway "${name}" archived successfully in audit logs.`);
    } catch (err) {
      setSuccess('Failed to save scenario.');
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <div id="decarbonization_scenarios" className="space-y-6">
      {/* Intro Header */}
      <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
          <Sliders className="w-5 h-5 text-emerald-400" /> Decarbonization pathway simulator
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Perform analytical sensitivity modeling to project future carbon performance. Adjust sliders to evaluate Scope offsets & savings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLIDER CONTROLS PANEL */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono">Sensitivity adjusters</h3>
            <button
              onClick={handleResetSliders}
              className="text-[10px] text-white/40 hover:text-white uppercase font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0"
            >
              <Undo2 className="w-3.5 h-3.5" /> Initialize sliders
            </button>
          </div>

          <div className="space-y-5 text-xs">
            {/* 1. Renewable procurement percentage */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-white/80 font-bold flex items-center gap-1">
                  1. Renewable energy procurement
                </span>
                <span className="text-cyan-400 font-bold font-mono">{renewablePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={renewablePercent}
                onChange={(e) => setRenewablePercent(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[10px] text-white/40 leading-tight">Offsets Grid electricity factor index by shifting loads to certified solar/wind power purchases.</p>
            </div>

            {/* 2. Electrification */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-white/80 font-bold">
                  2. EV Fleet electrification
                </span>
                <span className="text-emerald-400 font-bold font-mono">{fleetElectricPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fleetElectricPercent}
                onChange={(e) => setFleetElectricPercent(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-white/40 leading-tight">Substitutes gasoline and diesel trucks for electric logistics. Backloads 25% clean electricity variables.</p>
            </div>

            {/* 3. Business Travel reduction */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-white/80 font-bold">
                  3. Executive Travel reduction
                </span>
                <span className="text-indigo-400 font-bold font-mono">{travelReductionPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={travelReductionPercent}
                onChange={(e) => setTravelReductionPercent(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <p className="text-[10px] text-white/40 leading-tight font-sans">Leverages video meetings to reduce flight booking passenger-km variables under Scope 3 category 6.</p>
            </div>

            {/* 4. General HVAC/lighting efficiency */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-white/80 font-bold">
                  4. Deep facility energy efficiency
                </span>
                <span className="text-amber-400 font-bold font-mono">{energyEfficiencyPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={energyEfficiencyPercent}
                onChange={(e) => setEnergyEfficiencyPercent(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[10px] text-white/40 leading-tight font-sans">Enforces LED conversions, smart thermostat sensors, and optimized boiler operations.</p>
            </div>
          </div>

          {/* PATHWAY SAVING FORM */}
          <form onSubmit={handleSaveSimulatedPathway} className="pt-4 border-t border-white/10 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-white/40">Archived pathway moniker</label>
              <input
                type="text"
                placeholder="Pathway Zero 2030"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-[#050505] border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-sans"
                required
              />
            </div>

            {success && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-lg tracking-normal font-sans"><CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-400" /> {success}</div>}

            <button
              type="submit"
              disabled={savingLoading}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs uppercase font-sans tracking-wider flex justify-center items-center gap-1 shadow-lg cursor-pointer transition-all"
            >
              <Save className="w-4 h-4 text-black" /> {savingLoading ? 'Commiting Logs...' : 'Archive Decarbonization Scenario'}
            </button>
          </form>
        </div>

        {/* DOUBLE COLUMN SAVINGS GRAPHS & CO2 OFFSET COMPILATIONS */}
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Visual Dual Bars Plot */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingDown className="w-4.5 h-4.5 text-emerald-400" /> Projected Scope offsets
              </h3>
              <p className="text-[11px] text-white/40 mb-4">Emissions (tCO2e) current baseline vs. scenario.</p>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Current" fill="#10b981" opacity={0.2} />
                    <Bar dataKey="Simulated" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Simulated Savings Summary cards */}
            <div className="space-y-4 flex flex-col justify-center">
              <div className="bg-[#050505] border border-white/10 p-4 rounded-xl text-center relative overflow-hidden shadow">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Decarbon potential savings</span>
                <h4 className="text-2.5xl font-extrabold text-white mt-1.5 font-mono">
                  -{simulated.totalSaved.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  <span className="text-xs text-white/40 font-medium ml-1">tCO2e ({Math.round(simulated.percentSaved)}%)</span>
                </h4>
                <div className="flex justify-around text-[10px] text-white/40 font-mono mt-3 uppercase border-t border-white/10 pt-2.5">
                  <div>
                    Baseline: <strong className="text-white font-mono">{baselines.total.toFixed(0)}t</strong>
                  </div>
                  <div>
                    Projected: <strong className="text-emerald-400 font-mono font-bold">{simulated.total.toFixed(0)}t</strong>
                  </div>
                </div>
              </div>

              {/* Ecological equivalents list */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                {/* 1. Currency equivalent */}
                <div className="p-2.5 bg-[#050505] border border-white/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
                  <span className="text-white/40">Margin savings</span>
                  <div className="text-xs font-bold text-white mt-0.5">${Math.round(simulated.financialSavings).toLocaleString('en-US')}</div>
                </div>

                {/* 2. Trees Equivalent */}
                <div className="p-2.5 bg-[#050505] border border-white/10 rounded-lg">
                  <TreePine className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                  <span className="text-white/40">Trees grown</span>
                  <div className="text-xs font-bold text-white mt-0.5">{simulated.equivalencies.trees.toLocaleString('en-US')}</div>
                </div>

                {/* 3. Cars Equivalent */}
                <div className="p-2.5 bg-[#050505] border border-white/10 rounded-lg">
                  <Car className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                  <span className="text-white/40">Cars off index</span>
                  <div className="text-xs font-bold text-white mt-0.5">{simulated.equivalencies.cars}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Archived scenarios selectors list */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold mb-2.5">Saved organizational pathways</h4>
            
            {savedScenarios.length === 0 ? (
              <div className="p-3 border border-white/10 bg-[#050505] text-white/30 text-[10.5px] font-mono rounded-lg">
                No archived pathways parsed yet. Slide gauges and click save to persist strategies.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {savedScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleApplyPreset(sc)}
                    className="p-2.5 bg-[#050505] border border-white/10 hover:border-emerald-500/50 rounded-lg flex items-center gap-1.5 text-left text-[11px] hover:scale-[1.01] transition-all cursor-pointer text-white/70"
                  >
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                    <div>
                      <div className="font-semibold text-white">{sc.name}</div>
                      <div className="text-[9px] text-white/40 mt-0.5">
                        RE: {sc.renewablePercent}% &bull; EV: {sc.fleetElectricPercent}% &bull; Eff: {sc.energyEfficiencyPercent}%
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
