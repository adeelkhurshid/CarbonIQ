import React, { useState, useEffect } from 'react';
import {
  Globe,
  LayoutGrid,
  ClipboardList,
  Sliders,
  Award,
  FileText,
  Settings,
  LogOut,
  Bell,
  ShieldCheck,
  Building,
  AlertTriangle,
  User as UserIcon,
  ExternalLink,
  Cpu,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import DataLog from './components/DataLog';
import Scenarios from './components/Scenarios';
import Benchmarking from './components/Benchmarking';
import Reports from './components/Reports';
import AdminFactors from './components/AdminFactors';
import {
  User,
  CompanyProfile,
  CalculationRecord,
  EmissionFactor,
  ReductionScenario,
  BenchmarkData,
  AuditLog,
  NotificationItem
} from './shared/types';

export default function App() {
  // Authentication & Session States
  const [session, setSession] = useState<User | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Active Screen Selector Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'datalog' | 'scenarios' | 'benchmarks' | 'reports' | 'admin'>('dashboard');

  // Enterprise Database States
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [scenarios, setScenarios] = useState<ReductionScenario[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isMetric, setIsMetric] = useState<boolean>(true);

  // Utility state: Show profile configuration popup
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    industry: 'Manufacturing',
    reportingYear: 2026,
    country: 'United States',
    employeeCount: 450,
    revenue: 45,
    targetReductionPercentage: 35
  });

  const [notifDropdown, setNotifDropdown] = useState(false);

  // Auth screen handlers
  const handleAuthSuccess = (user: User, token: string) => {
    setSession(user);
    // Fetch state in parallel
    fetchDatabaseState();
    // Fetch matching company profile
    fetch('/api/company')
      .then(res => res.json())
      .then(co => {
        if (co) {
          setCompany(co);
          setProfileForm({
            name: co.name,
            industry: co.industry,
            reportingYear: co.reportingYear,
            country: co.country,
            employeeCount: co.employeeCount,
            revenue: co.revenue,
            targetReductionPercentage: co.targetReductionPercentage
          });
        }
      });
  };

  // Check existing session status on first page load
  const checkSessionStatus = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (data.active && data.session && data.company) {
        setSession(data.session);
        setCompany(data.company);
        setProfileForm({
          name: data.company.name,
          industry: data.company.industry,
          reportingYear: data.company.reportingYear,
          country: data.company.country,
          employeeCount: data.company.employeeCount,
          revenue: data.company.revenue,
          targetReductionPercentage: data.company.targetReductionPercentage
        });
        await fetchDatabaseState();
      }
    } catch (err) {
      console.warn('Session verification offline.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch carbon tracking databases in parallel from server
  const fetchDatabaseState = async () => {
    try {
      const [
        resCalculations,
        resFactors,
        resScenarios,
        resBenchmarks,
        resAuditLogs,
        resNotifications
      ] = await Promise.all([
        fetch('/api/calculations'),
        fetch('/api/factors'),
        fetch('/api/scenarios'),
        fetch('/api/benchmarks'),
        fetch('/api/audit-logs'),
        fetch('/api/notifications')
      ]);

      const [
        dataCalculations,
        dataFactors,
        dataScenarios,
        dataBenchmarks,
        dataAuditLogs,
        dataNotifications
      ] = await Promise.all([
        resCalculations.json(),
        resFactors.json(),
        resScenarios.json(),
        resBenchmarks.json(),
        resAuditLogs.json(),
        resNotifications.json()
      ]);

      setCalculations(dataCalculations || []);
      setEmissionFactors(dataFactors || []);
      setScenarios(dataScenarios || []);
      setBenchmarks(dataBenchmarks || []);
      setAuditLogs(dataAuditLogs || []);
      setNotifications(dataNotifications || []);
    } catch (err) {
      console.error('Error fetching database state indices', err);
    }
  };

  const handleUpdateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;

    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setCompany(data.company);
        setShowProfileModal(false);
        fetchDatabaseState(); // Sync logs
      }
    } catch (err) {
      alert('Error updating company metrics profile.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      setCompany(null);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFactorAdmin = async (factorBody: any) => {
    const res = await fetch('/api/factors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...factorBody,
        userEmail: session?.email
      })
    });
    const data = await res.json();
    if (data.success) {
      fetchDatabaseState();
    } else {
      throw new Error(data.error);
    }
  };

  const handleSaveScenarioAdmin = async (scenarioBody: any) => {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...scenarioBody,
        userEmail: session?.email
      })
    });
    const data = await res.json();
    if (data.success) {
      fetchDatabaseState();
    } else {
      throw new Error(data.error);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    checkSessionStatus();
  }, []);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-mono text-xs gap-3">
        <Cpu className="w-10 h-10 text-emerald-400 animate-spin" />
        <span className="text-emerald-400 animate-pulse uppercase tracking-widest">Initialising CarbonIQ Systems...</span>
        <span className="text-slate-500 text-[10px]">Loading IPCC & GHG Protocols schema.</span>
      </div>
    );
  }

  // Render Authentication screen if no authenticated corporate session exists
  if (!session || !company) {
    return <AuthScreen onLoginSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      
      {/* ENTERPRISE APP HEADER */}
      <header className="bg-[#0A0A0A] border-b border-white/10 shrink-0 select-none px-4 md:px-6 py-3.5 flex justify-between items-center relative z-20">
        <div id="enterprise_logo" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold">C</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-sans">CarbonIQ</span>
              <span className="text-[9px] font-mono leading-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">SaaS</span>
            </div>
            <p className="text-[10px] text-white/40 tracking-wider">Measure. Reduce. Report.</p>
          </div>
        </div>

        {/* Dynamic header items */}
        <div className="flex items-center gap-4">
          
          {/* SEC compliant Reporting alert status */}
          <div className="hidden lg:flex items-center gap-2 bg-[#050505] px-3 py-1.5 border border-white/10 rounded-xl text-xs font-mono text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white/40">Standard:</span>
            <strong className="text-white">IPCC-GHG-v6</strong>
          </div>

          {/* NOTIFICATION CENTER DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdown(!notifDropdown)}
              className="p-2.5 bg-[#050505] border border-white/10 hover:border-white/20 hover:text-white rounded-xl text-white/60 transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] flex items-center justify-center font-black">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-80 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-4 space-y-3 font-sans"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Actionable Alerts ({notifications.length})</span>
                    <button onClick={() => setNotifDropdown(false)} className="text-[10px] text-white/40 hover:text-white uppercase underline cursor-pointer">dismiss</button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-white/40 font-mono">No carbon compliance alerts pending. Your audit is full.</div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2.5 bg-[#050505] border border-white/5 rounded-lg text-[11px] relative">
                          <div className="font-semibold text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> {n.title}
                          </div>
                          <p className="text-white/60 mt-1 leading-normal text-[10.5px]">{n.description}</p>
                          <div className="mt-1.5 flex justify-between items-center text-[9px] font-mono text-white/40">
                            <span>Target: {n.targetDate}</span>
                            <button
                              onClick={() => dismissNotification(n.id)}
                              className="text-emerald-400 hover:underline cursor-pointer"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIVE ACCOUNT METADATA CARD */}
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {session.email}
              </div>
              <div className="mt-0.5 text-[10px] text-white/40 font-mono uppercase font-black">
                Role: <span className="text-emerald-400">[{session.role}]</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 bg-[#050505] border border-white/10 hover:border-white/20 hover:text-white rounded-xl text-white/60 transition-all cursor-pointer"
              title="Edit corporate profile metrics"
            >
              <Building className="w-4.5 h-4.5 text-emerald-400" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer border border-rose-500/20"
              title="Terminate authenticated portal session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <div className="flex-1 flex overflow-hidden">
         
        {/* SIDE BAR NAVIGATION SELECTORS */}
        <aside className="w-64 bg-[#0A0A0A] border-r border-white/10 hidden md:flex flex-col justify-between shrink-0 select-none p-4">
          <div className="space-y-6">
            <div className="text-[10px] uppercase font-mono tracking-widest text-white/45 font-semibold pl-3">WORKSPACE CORE</div>
            
            <nav className="space-y-1.5 px-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 cursor-pointer" /> Dashboard Console
              </button>

              <button
                onClick={() => setActiveTab('datalog')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'datalog'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4 cursor-pointer" /> Calculations & Sheets
              </button>

              <button
                onClick={() => setActiveTab('scenarios')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'scenarios'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 cursor-pointer" /> Decarbon Simulator
              </button>

              <button
                onClick={() => setActiveTab('benchmarks')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'benchmarks'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 cursor-pointer" /> Peer ESG Benchmarks
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'reports'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 cursor-pointer" /> Disclosures & Reports
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full py-2.5 px-4 rounded-md flex items-center gap-3 text-xs transition-all cursor-pointer text-left ${
                  activeTab === 'admin'
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/25'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 cursor-pointer" /> Administrative Area
              </button>
            </nav>
          </div>

          {/* SIDEBAR FOOTER ACCREDITATION CODES */}
          <div className="space-y-3.5 pt-4 border-t border-white/10">
            <div className="p-3.5 bg-[#050505] border border-white/10 rounded-xl space-y-1 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">ECOLOGY CO₂ INDEX</span>
              <div className="text-xs font-mono font-bold text-emerald-400">
                {calculations.reduce((sum, r) => sum + r.calculatedCo2e, 0).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                <span className="text-[9px] text-white/40 ml-1">tCO₂e</span>
              </div>
            </div>

            <div className="text-[10px] text-white/30 text-center font-mono leading-tight">
              CarbonIQ Corporate System<br />
              <strong className="text-white/50">Verifiably Audited</strong> &bull; 2026
            </div>
          </div>
        </aside>

        {/* MAIN VISUAL WORK STAGE */}
        <main className="flex-1 overflow-y-auto bg-[#050505] p-4 md:p-6 pb-20 relative">
          
          {/* MOBILE TABS HEADER SELECTOR BUTTONS */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-4 scrollbar-none select-none border-b border-white/10 mb-4 text-xs font-bold whitespace-nowrap">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('datalog')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'datalog' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Calculations
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'scenarios' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Scenario Sim
            </button>
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'benchmarks' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Benchmarks
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'reports' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'admin' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              Admin factors
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  company={company}
                  calculations={calculations}
                  isMetric={isMetric}
                  onSetMetric={setIsMetric}
                />
              )}

              {activeTab === 'datalog' && (
                <DataLog
                  calculations={calculations}
                  emissionFactors={emissionFactors}
                  isMetric={isMetric}
                  userEmail={session.email}
                  onRefresh={fetchDatabaseState}
                />
              )}

              {activeTab === 'scenarios' && (
                <Scenarios
                  company={company}
                  calculations={calculations}
                  onSaveScenario={handleSaveScenarioAdmin}
                  savedScenarios={scenarios}
                />
              )}

              {activeTab === 'benchmarks' && (
                <Benchmarking
                  company={company}
                  calculations={calculations}
                  benchmarks={benchmarks}
                />
              )}

              {activeTab === 'reports' && (
                <Reports
                  company={company}
                  calculations={calculations}
                />
              )}

              {activeTab === 'admin' && (
                <AdminFactors
                  emissionFactors={emissionFactors}
                  auditLogs={auditLogs}
                  userRole={session.role}
                  userEmail={session.email}
                  onAddFactor={handleCreateFactorAdmin}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* FOOTER METRIC REGISTRATIONS EXPLAINER CODES */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 shrink-0 text-center py-2.5 select-none hidden lg:block text-[10px] text-white/30 font-mono uppercase tracking-[0.15em]">
        CARBONIQ PORTAL &bull; GHG COMPASS v2.1.2 &bull; SEC REGULATION CLASSIFICATIONS &bull; ALL RIGHTS RESERVED
      </footer>

      {/* POPUP: EDIT CORPORATE COMPILATION PROFILE METRICS */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4 text-xs font-sans"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-5 h-5 text-emerald-400" /> Administrative profile configuration
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-white/40 hover:text-white font-bold uppercase hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleUpdateCompanyProfile} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[9px] font-bold">Company moniker</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label className="text-white/40 uppercase tracking-widest font-mono text-[9px] font-bold">Sector category</label>
                    <select
                      value={profileForm.industry}
                      onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                      className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="SMEs & Services">SMEs & Services</option>
                      <option value="Retail & Commerce">Retail & Commerce</option>
                      <option value="Logistics & Freight">Logistics & Freight</option>
                      <option value="Agriculture & Dairy">Agriculture & Dairy</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-white/40 uppercase tracking-widest font-mono text-[9px] font-bold">Operating country</label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="text-white/40 uppercase tracking-widest font-mono text-[9px]">Reporting Year</label>
                    <input
                      type="number"
                      value={profileForm.reportingYear}
                      onChange={(e) => setProfileForm({ ...profileForm, reportingYear: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  {/* Staff count */}
                  <div className="space-y-1.5">
                    <label className="text-white/40 uppercase tracking-widest font-mono text-[9px]">Employees</label>
                    <input
                      type="number"
                      value={profileForm.employeeCount}
                      onChange={(e) => setProfileForm({ ...profileForm, employeeCount: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  {/* Revenue */}
                  <div className="space-y-1.5">
                    <label className="text-white/40 uppercase tracking-widest font-mono text-[9px]">Revenue ($M)</label>
                    <input
                      type="number"
                      value={profileForm.revenue}
                      onChange={(e) => setProfileForm({ ...profileForm, revenue: Number(e.target.value) })}
                      className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Target reduction */}
                <div className="space-y-1.5">
                  <label className="text-white/40 uppercase tracking-widest font-mono text-[9px] font-bold">Reduction targets goal (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={profileForm.targetReductionPercentage}
                    onChange={(e) => setProfileForm({ ...profileForm, targetReductionPercentage: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#050505] border border-white/10 text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs tracking-wider uppercase shadow-lg transition-all cursor-pointer"
                >
                  Synchronize active parameters
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
