export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Company Owner' | 'Sustainability Manager' | 'Analyst';
  mfaEnabled: boolean;
  mfaSecret?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  country: string;
  reportingYear: number;
  employeeCount: number;
  revenue: number; // in Millions USD
  boundaries: {
    scope1: boolean;
    scope2: boolean;
    scope3: boolean;
    scope3Categories: string[]; // Category names or IDs
  };
  currency: string;
  targetReductionPercentage: number;
}

export interface EmissionFactor {
  id: string;
  country: string;
  category: string; // "Stationary", "Mobile", "Refrigerants", "Purchased Electricity", "Scope 3 Category X"
  source: string; // e.g. "Natural Gas", "Diesel", "Petrol"
  factor: number; // in kg CO2e / standard unit
  unit: string; // kg, Litre, kWh, etc.
  source_reference: string;
  version: string;
  year: number;
}

export interface CalculationRecord {
  id: string;
  date: string; // ISO String
  companyId: string;
  type: 'scope1_stationary' | 'scope1_mobile' | 'scope1_refrigerant' | 'scope2_electricity' | 'scope3';
  category: string; // Sub-category names (e.g. "Purchased Electricity", "Upstream Transport")
  source: string; // Fuel or asset type (e.g. "Natural Gas", "Diesel", "Employee Commuting")
  amount: number;
  unit: string; // input unit, e.g. gallons, Litre, MWh, ft3
  scope: 1 | 2 | 3;
  facility: string; // facility/location name
  calculatedCo2e: number; // in metric tonnes (tCO2e)
  formula: string; // Formula trace text e.g., "1,200 Litre x 2.68 kg CO2e/Litre = 3.22 tCO2e"
  userEmail: string; // Creator
  comment?: string;
}

export interface ReductionScenario {
  id: string;
  companyId: string;
  name: string;
  renewablePercent: number; // 0 - 100
  fleetElectricPercent: number; // 0 - 100
  travelReductionPercent: number; // 0 - 100
  energyEfficiencyPercent: number; // 0 - 100
}

export interface AuditLog {
  id: string;
  date: string;
  email: string;
  role: string;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  companyId: string;
  date: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  read: boolean;
}

export interface BenchmarkData {
  industry: string;
  averageIntensity: number; // tCO2e / employee
  revenueIntensity: number; // tCO2e / $M revenue
  country: string;
}
