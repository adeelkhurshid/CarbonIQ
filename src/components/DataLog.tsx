import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  ChevronRight,
  Info,
  HelpCircle,
  Sparkles,
  Download
} from 'lucide-react';
import { CalculationRecord, EmissionFactor } from '../shared/types';

interface DataLogProps {
  calculations: CalculationRecord[];
  emissionFactors: EmissionFactor[];
  isMetric: boolean;
  userEmail: string;
  onRefresh: () => void;
}

export default function DataLog({ calculations, emissionFactors, isMetric, userEmail, onRefresh }: DataLogProps) {
  // Manual Input form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'scope1_stationary' | 'scope1_mobile' | 'scope1_refrigerant' | 'scope2_electricity' | 'scope3'>('scope1_stationary');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [unit, setUnit] = useState<string>('');
  const [facility, setFacility] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isMarketBased, setIsMarketBased] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk Importer UI state
  const [importMode, setImportMode] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [parsingResult, setParsingResult] = useState<{
    importedCount: number;
    records: CalculationRecord[];
    errors: string[];
  } | null>(null);

  // Group emission factors based on selected Scope entry type
  const sortedFactors = useMemo(() => {
    return emissionFactors.filter((f) => {
      if (type === 'scope1_stationary') return f.category === 'Stationary Combustion';
      if (type === 'scope1_mobile') return f.category === 'Mobile Combustion';
      if (type === 'scope1_refrigerant') return f.category === 'Refrigerants';
      if (type === 'scope2_electricity') return f.category === 'Purchased Electricity';
      if (type === 'scope3') return f.category.startsWith('Category') || f.id.startsWith('f_sc3');
      return false;
    });
  }, [emissionFactors, type]);

  // Sync unit list and selection when source details change
  React.useEffect(() => {
    if (sortedFactors.length > 0) {
      const first = sortedFactors[0];
      setSelectedSource(first.source);
      // set units
      setUnit(first.unit);
    } else {
      setSelectedSource('');
      setUnit('');
    }
  }, [sortedFactors]);

  // Adjust units list based on source
  const availableUnits = useMemo(() => {
    const defaultFactor = emissionFactors.find(f => f.source === selectedSource);
    if (!defaultFactor) return ['kg'];

    // Group relative metric and imperial pairs
    const unitMap: { [key: string]: string[] } = {
      'm3': ['m3', 'ft3'],
      'ft3': ['m3', 'ft3'],
      'Litre': ['Litre', 'gallon'],
      'L': ['Litre', 'gallon'],
      'gallon': ['Litre', 'gallon'],
      'kg': ['kg', 'lbs', 'tonne'],
      'tonne': ['tonne', 'kg', 'lbs'],
      'kWh': ['kWh', 'MWh'],
      'MWh': ['kWh', 'MWh'],
      'tonne-km': ['tonne-km'],
      'passenger-km': ['passenger-km'],
      'km': ['km', 'miles'],
      'USD': ['USD']
    };

    return unitMap[defaultFactor.unit] || [defaultFactor.unit];
  }, [selectedSource, emissionFactors]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || amount === '' || isNaN(Number(amount)) || !unit) {
      setError('Please fully define activity parameters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Find matching factor
      const factorObj = sortedFactors.find(f => f.source === selectedSource);
      const categoryName = factorObj ? factorObj.category : 'General Operations';

      const res = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          type,
          category: categoryName,
          source: selectedSource,
          amount,
          unit,
          facility: facility || 'Atlanta Heavy Forge',
          userEmail,
          comment,
          isMarketBased
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Calculation processed: ${data.record.calculatedCo2e} tonnes of CO2e! Log committed.`);
        setAmount('');
        setComment('');
        onRefresh();
      } else {
        setError(data.error || 'Server rejected carbon transaction log.');
      }
    } catch (err) {
      setError('Loss of communication with calculation microservice.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emission record from the audit trail?')) return;
    try {
      const res = await fetch(`/api/calculations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      alert('Delete operation failed.');
    }
  };

  // Importer helper: Parse CSV lines manually
  const loadBulkSamples = () => {
    const currentYear = new Date().getFullYear();
    const mockCSV = `Date,Source,Category,Amount,Unit,Facility,Comment
${currentYear}-01-20,Natural Gas,Stationary Combustion,8000,m3,Primary Forge,Automated meter readout
${currentYear}-02-14,R134a,Refrigerants,3.5,kg,Detroit Distribution Yard,Refill of coolant leak
${currentYear}-03-10,Electricity Grid,Purchased Electricity,62000,kWh,Ohio Warehouse Forge,Billing cycle 2
${currentYear}-04-05,Trucks,Mobile Combustion,2500,Litre,Detroit Yard,Logistics fuel card bulk
${currentYear}-05-18,Average petrol vehicle commute,Category 7 Employee Commuting,12000,km,Corporate HQ,Consolidated workforce commute proxy
${currentYear}-06-01,National rail passenger travel,Category 6 Business Travel,8500,passenger-km,Chicago HQ,Q2 Sales team travel logs`;
    setBulkCsvText(mockCSV);
    setError('');
  };

  const handleBulkSubmit = async () => {
    setError('');
    setParsingResult(null);

    if (!bulkCsvText.trim()) {
      setError('Please paste spreadsheet data or click Load Sample.');
      return;
    }

    const rows = bulkCsvText.split('\n');
    const header = rows[0].split(',');
    
    // Convert lines into JSON nodes
    const recordsPayload: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const line = rows[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 5) continue; // Malformed row

      recordsPayload.push({
        date: columns[0] ? new Date(columns[0]).toISOString() : new Date().toISOString(),
        source: columns[1],
        category: columns[2],
        amount: Number(columns[3]),
        unit: columns[4],
        facility: columns[5] || 'Importers Facility',
        comment: columns[6] || 'Imported via Bulk Upload Wizard'
      });
    }

    try {
      const res = await fetch('/api/calculations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: recordsPayload,
          userEmail
        })
      });

      const data = await res.json();
      if (data.success) {
        setParsingResult({
          importedCount: data.importedCount,
          records: data.records,
          errors: data.errors
        });
        onRefresh();
      } else {
        setError(data.error || 'Failed to execute bulk verification task');
      }
    } catch (err) {
      setError('Error parsing or submitting CSV values.');
    }
  };

  return (
    <div id="data_logging_center" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-[#0A0A0A] border border-white/10 rounded-xl relative">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5 text-emerald-400" /> Emission Logs & Importer Wizard
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Build Scope 1, 2, 3 inventory listings via high-accuracy manual sheets or spreadsheet CSV bulk ingest.
          </p>
        </div>

        <button
          onClick={() => {
            setImportMode(!importMode);
            setParsingResult(null);
            setError('');
            setSuccess('');
          }}
          className="mt-3 md:mt-0 px-4 py-2 bg-[#050505] border border-white/10 hover:bg-white/5 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer text-emerald-400 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> {importMode ? 'Switch to Manual Entry form' : 'Switch to Bulk CSV Importer'}
        </button>
      </div>

      {importMode ? (
        /* CSV IMPORT WIZARD PANEL */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Upload className="w-4.5 h-4.5 text-emerald-400" /> Bulk spreadsheet wizard
                </h3>
                <p className="text-[11px] text-white/40">Paste your CSV strings from Microsoft Excel, or load standard template mockups.</p>
              </div>

              <button
                onClick={loadBulkSamples}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-mono font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample corporate logs
              </button>
            </div>

            {error && <div className="p-3 bg-rose-550/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-mono">{error}</div>}

            <textarea
              className="w-full h-64 p-3 bg-[#050505] text-white/90 font-mono text-xs border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
              placeholder="Date,Source,Category,Amount,Unit,Facility,Comment&#10;2026-06-14,Diesel,Stationary Combustion,650,Litre,Ohio Forge,Standby generator fuel fill..."
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
            />

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Validation engine validates matching GHG factors
              </span>

              <button
                onClick={handleBulkSubmit}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/10 cursor-pointer font-sans transition-all"
              >
                Verify & calculate bulk inventory
              </button>
            </div>
          </div>

          {/* BULK RESPONSE ENGINE CARD */}
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1 font-mono">
              <ClipboardList className="w-4 h-4 text-emerald-400" /> Audit trail report
            </h4>
            <p className="text-[11px] text-white/40">Upload parser diagnostics. Errors will throw if factors do not match standard lists.</p>

            {parsingResult ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#050505] border border-white/10 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-white text-xs font-bold">{parsingResult.importedCount} perfect lines logged</div>
                    <div className="text-[10px] text-white/40 font-mono uppercase">Calculations stored securely</div>
                  </div>
                </div>

                {parsingResult.errors.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-rose-400 flex items-center gap-1 uppercase tracking-wider font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" /> Parsed errors ({parsingResult.errors.length})
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] text-white/50">
                      {parsingResult.errors.map((err, i) => (
                        <div key={i} className="p-1.5 bg-rose-500/5 text-rose-400/80 rounded border border-rose-500/10 animate-fade-in">
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-950/5 text-center text-xs text-white/40 font-mono border border-emerald-500/10 rounded-xl">
                    No parser warnings found. Your spreadsheet template meets all GHG protocol schemas.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-white/5 bg-[#050505] rounded-xl text-white/40 text-xs font-mono">
                <FileSpreadsheet className="w-8 h-8 text-white/20 mb-2" />
                <span>Fill spreadsheet variables, compile, and execute for calculations preview.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MANUAL DATA ENTRY FORM WITH SELECTION MATRIX */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl md:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 font-mono">
              <Plus className="w-4 h-4 text-emerald-400" /> Calculate manual transaction
            </h3>
            <p className="text-[11px] text-white/40 mb-5">Record single company parameters directly. Engine translates activities to tCO2e.</p>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Entry Date */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Record date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                {/* Scope Classification Type */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Scope category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="scope1_stationary">Scope 1: Stationary Combustion</option>
                    <option value="scope1_mobile">Scope 1: Mobile Combustion</option>
                    <option value="scope1_refrigerant">Scope 1: Refrigerants leaks</option>
                    <option value="scope2_electricity">Scope 2: Purchased Electricity</option>
                    <option value="scope3">Scope 3: Value Chain (1-15 Categories)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Specific Fuel Source */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px]">Specific Source</label>
                  <select
                    value={selectedSource}
                    onChange={(e) => {
                      setSelectedSource(e.target.value);
                      const act = sortedFactors.find(f => f.source === e.target.value);
                      if (act) setUnit(act.unit);
                    }}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {sortedFactors.map((f) => (
                      <option key={f.id} value={f.source}>
                        {f.source} {f.country !== 'Global' ? `(${f.country})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Facility location */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Operational facility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Primary Forge, Ohio"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Scope 2 Market style checkbox conditional */}
              {type === 'scope2_electricity' && (
                <div className="p-3 bg-[#050505] border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold font-mono text-[10px] uppercase tracking-wider">Market-Based contract</div>
                    <div className="text-[10.5px] text-white/40">Enable this if you have a premium 100% certified renewable energy power agreement.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMarketBased}
                    onChange={(e) => setIsMarketBased(e.target.checked)}
                    className="w-4.5 h-4.5 text-emerald-555 rounded focus:ring-emerald-500 bg-[#050505] border-white/10"
                  />
                </div>
              )}

              {/* Quantity consumption and units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px] flex items-center gap-1">
                    Activity logs quantity limit
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15400"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px]">Active Reporting Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  >
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* General comment */}
              <div className="space-y-1.5">
                <label className="text-white/40 uppercase tracking-widest font-semibold font-mono text-[9px]">Voucher reference/comment</label>
                <input
                  type="text"
                  placeholder="Billing reference, supplier numbers, cargo invoice vouchers..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-mono">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-mono"><CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-400" /> {success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/10 flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-4.5 h-4.5" /> {loading ? 'Computing CO2 Equivalent...' : 'Confirm Footprint entry'}
              </button>
            </form>
          </div>

          {/* ACTIVE INVENTORY FACTORS REFERENCE */}
          <div className="bg-[#0A0A0A] border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                <Layers className="w-4.5 h-4.5 text-cyan-400" /> Active Emission Factors
              </h4>
              <p className="text-[11px] text-white/40 mb-4">CarbonIQ is calculating carbon equivalent based on modern GHG coefficients below.</p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 flex-1">
              {sortedFactors.slice(0, 6).map((fac) => (
                <div key={fac.id} className="p-2.5 bg-[#050505] border border-white/10 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white font-mono text-[10px]">{fac.source}</span>
                    <span className="text-[10px] bg-white/10 py-0.5 px-1.5 rounded font-mono text-white/50">{fac.country}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between items-center text-[10px] font-mono text-white/40">
                    <div>
                      Factor: <span className="text-emerald-400 font-bold">{fac.factor} kg</span> / {fac.unit}
                    </div>
                    <div className="text-[9px] text-white/30 truncate" title={fac.source_reference}>{fac.version} &bull; IPCC</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#050505] border border-white/10 rounded-xl flex items-start gap-2 text-[10px] text-white/45 mt-4 leading-relaxed font-sans">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>GHG values represent carbon equivalence (CO2e, including CH4 and N2O offsets). Admin users can edit coefficients in Admin factors panel.</span>
            </div>
          </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS TABLE - AUDIT TRAIL */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-lg p-5">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1 font-mono">
            <ClipboardList className="w-4 h-4 text-emerald-400" /> Auditable carbon ledger entries ({calculations.length})
          </h4>
          <p className="text-xs text-white/40">This table is non-falsifiable and tracks transparency log trace formulas for regulatory disclosures.</p>
        </div>

        {calculations.length === 0 ? (
          <div className="py-12 border border-dashed border-white/10 rounded-xl text-center text-white/40 font-mono text-xs">
            No entries captured yet. Use the manual form or CSV wizard to insert records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-mono uppercase tracking-wider text-[9px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Facility</th>
                  <th className="py-3 px-3 col-span-2">Source & Category</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3">Trace & GWP Formula</th>
                  <th className="py-3 px-3 text-right">Emissions (tCO2e)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {calculations.map((record) => {
                  let scopeBadge = (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Scope 1</span>
                  );
                  if (record.scope === 2) {
                    scopeBadge = (
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Scope 2</span>
                    );
                  } else if (record.scope === 3) {
                    scopeBadge = (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Scope 3</span>
                    );
                  }

                  return (
                    <tr key={record.id} className="hover:bg-white/5 text-white/80">
                      <td className="py-3 px-3 whitespace-nowrap text-white/40">{record.date.split('T')[0]}</td>
                      <td className="py-3 px-3 text-white/90 font-sans font-medium">{record.facility}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-sans font-bold text-white">
                          {record.source}
                        </div>
                        <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1 font-mono">
                          {scopeBadge} &bull; {record.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                        {record.amount.toLocaleString('en-US', { maximumFractionDigits: 1 })} {record.unit}
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[10px] text-white/50 overflow-hidden text-ellipsis leading-tight" title={record.formula}>
                        <div className="font-bold text-emerald-400">{record.comment || 'Footprint Record'}</div>
                        <div className="text-[9px] truncate mt-1 text-white/30 font-sans">{record.formula}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white text-sm whitespace-nowrap">
                        {record.calculatedCo2e.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                          title="Delete record from ledger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
