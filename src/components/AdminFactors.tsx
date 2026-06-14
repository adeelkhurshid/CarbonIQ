import React, { useState, useMemo } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  FolderLock,
  Globe,
  RefreshCw,
  Search,
  UserCheck,
  AlertTriangle,
  History,
  Terminal,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { EmissionFactor, AuditLog } from '../shared/types';

interface AdminFactorsProps {
  emissionFactors: EmissionFactor[];
  auditLogs: AuditLog[];
  userRole: string;
  userEmail: string;
  onAddFactor: (factor: any) => Promise<void>;
}

export default function AdminFactors({
  emissionFactors,
  auditLogs,
  userRole,
  userEmail,
  onAddFactor
}: AdminFactorsProps) {
  // Access check
  const hasAccess = useMemo(() => {
    return userRole === 'Admin' || userRole === 'Company Owner';
  }, [userRole]);

  const [activeSubTab, setActiveSubTab] = useState<'database' | 'audit'>('database');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Factor form state
  const [country, setCountry] = useState('Global');
  const [category, setCategory] = useState('Stationary Combustion');
  const [source, setSource] = useState('');
  const [factor, setFactor] = useState<number | ''>('');
  const [unit, setUnit] = useState('Litre');
  const [sourceRef, setSourceRef] = useState('IPCC Standard default values 2026');
  const [year, setYear] = useState(2026);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Filter factors list
  const filteredFactors = useMemo(() => {
    if (!searchQuery.trim()) return emissionFactors;
    return emissionFactors.filter((f) => {
      const q = searchQuery.toLowerCase();
      return (
        f.source.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.country.toLowerCase().includes(q)
      );
    });
  }, [emissionFactors, searchQuery]);

  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || factor === '' || isNaN(Number(factor)) || !unit) {
      setError('Please fully define emission source coefficients.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onAddFactor({
        country,
        category,
        source,
        factor: Number(factor),
        unit,
        source_reference: sourceRef,
        version: 'Custom-v3',
        year: Number(year)
      });
      setSuccess(`Coefficient registered successfully: ${source} = ${factor} kg CO2e / ${unit}`);
      setSource('');
      setFactor('');
    } catch (err) {
      setError('Administrative register dispatch failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div id="admin_access_restricted" className="p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl text-center space-y-4 max-w-lg mx-auto font-sans">
        <FolderLock className="w-14 h-14 text-rose-500 mx-auto bg-rose-500/10 p-2.5 rounded-2xl border border-rose-500/20" />
        <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Administrative Access Restricted</h3>
        <p className="text-xs text-white/50 leading-relaxed">
          This system is restricted to the **Admin** or **Company Owner** roles to protect underlying mathematical calculation metrics. 
          Your active account role is mapped as: <strong className="text-rose-400 font-mono">[{userRole}]</strong>.
        </p>
        <p className="text-[11px] text-white/30 font-mono uppercase">
          Evaluate by switching to "Admin" or "Owner" via Sandbox selectors on the Login screens.
        </p>
      </div>
    );
  }

  return (
    <div id="admin_factors_module" className="space-y-6">
      {/* Upper subtabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveSubTab('database')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'database' ? 'text-white border-white font-extrabold' : 'text-white/40 border-transparent hover:text-white/70'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-400" /> Emission Factors Database
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'audit' ? 'text-white border-white font-extrabold' : 'text-white/40 border-transparent hover:text-white/70'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" /> Audit Logs Subsystem
        </button>
      </div>

      {activeSubTab === 'database' ? (
        /* FACTOR REGISTER DATABASE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          {/* REGISTER FORM */}
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest font-mono flex items-center gap-1">
              <Plus className="w-4 h-4 text-emerald-400" /> Register coefficient factor
            </h3>
            <p className="text-[11px] text-white/50">Add custom fuel constants. Changes update calculation equations globally.</p>

            <form onSubmit={handleCreateFactor} className="space-y-4 text-xs">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Factor classification</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                >
                  <option value="Stationary Combustion">Scope 1: Stationary Combustion</option>
                  <option value="Mobile Combustion">Scope 1: Mobile Combustion</option>
                  <option value="Refrigerants">Scope 1: Refrigerants GWP</option>
                  <option value="Purchased Electricity">Scope 2: Purchased Electricity</option>
                  <option value="Category 1 Purchased Goods & Services">Scope 3: Category 1 Purchased Goods</option>
                  <option value="Category 5 Waste Generated in Operations">Scope 3: Category 5 Waste</option>
                  <option value="Category 6 Business Travel">Scope 3: Category 6 Business Travel</option>
                  <option value="Category 7 Employee Commuting">Scope 3: Category 7 Commuting</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source Name */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Source name</label>
                  <input
                    type="text"
                    placeholder="e.g. Liquid Gas Propane"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                    required
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px] flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-white/40" /> Country scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Numeric factor */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Value (kg CO2e)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.884"
                    value={factor}
                    onChange={(e) => setFactor(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                {/* Standard base unit */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Base Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
                  >
                    <option value="Litre">Litre</option>
                    <option value="gallon">gallon</option>
                    <option value="kg">kg</option>
                    <option value="tonne">tonne</option>
                    <option value="m3">m3</option>
                    <option value="ft3">ft3</option>
                    <option value="kWh">kWh</option>
                    <option value="tonne-km">tonne-km</option>
                    <option value="passenger-km">passenger-km</option>
                    <option value="km">km</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Reference */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Reference Agency</label>
                  <input
                    type="text"
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-sans text-xs"
                    required
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[10px]">Discourse Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg"><CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-400" /> {success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold rounded-lg text-xs uppercase tracking-wider hover:scale-[1.01] transition-all cursor-pointer font-sans"
              >
                {loading ? 'Dispersing coefficients...' : 'Authorize database Constant'}
              </button>
            </form>
          </div>

          {/* ACTIVE DB VIEW */}
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl lg:col-span-2 space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Factor database registry</h3>
                <p className="text-[11px] text-white/50">Total list of carbon constant equations mapped for engine audits in reporting year 2026.</p>
              </div>

              <div className="relative w-full sm:w-56 text-xs">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Filter factors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] border border-white/10 rounded-xl overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-[#050505] text-white/40 font-mono uppercase tracking-wider text-[9px]">
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Source Name</th>
                    <th className="py-2.5 px-3">Country</th>
                    <th className="py-2.5 px-3 text-right">Coefficient factor</th>
                    <th className="py-2.5 px-3">Agency Ref & Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono font-medium text-[11px]">
                  {filteredFactors.map((f) => (
                    <tr key={f.id} className="hover:bg-white/5 text-white/80 transition-colors">
                      <td className="py-2.5 px-3 max-w-[120px] truncate text-white/40 uppercase text-[9px] font-sans font-bold">{f.category}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{f.source}</td>
                      <td className="py-2.5 px-3 text-cyan-400 text-xs">{f.country}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {f.factor.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                        <span className="text-[9px] text-white/40 font-medium ml-1">kg/{f.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-white/40 max-w-[150px] truncate text-[10px] font-sans" title={f.source_reference}>
                        {f.source_reference} &bull; <strong className="text-white/65">{f.year}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIT TRAILS TERMINAL LOG MONITOR */
        <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Terminal className="w-5 h-5 text-emerald-400" /> Non-falsifiable Audit Subsystem
              </h3>
              <p className="text-[11px] text-white/50">Chronological records logging portal provisioning, identity authorization, and coefficient factors updates.</p>
            </div>
            
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1 px-2 rounded-full font-mono font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Ledger online
            </span>
          </div>

          <div className="bg-[#050505] p-4 border border-white/10 rounded-xl max-h-96 overflow-y-auto space-y-3 font-mono text-[10.5px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#0A0A0A] border border-white/10 rounded-lg space-y-1.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-white/30 gap-1">
                  <div>
                    Timestamp: <strong className="text-white/50">{log.date.replace('T', ' ').replace('Z', '')}</strong>
                  </div>
                  <div className="uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 text-[9px] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> {log.role} ({log.email})
                  </div>
                </div>
                
                <div className="flex gap-2 text-white/95">
                  <span className="text-cyan-400 font-bold font-mono">[{log.action}]</span>
                  <span className="font-sans text-white/70 leading-normal">{log.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
