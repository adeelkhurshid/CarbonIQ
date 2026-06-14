import { EmissionFactor } from './types';

// Convert any input activity unit to the emission factor standard base unit
// We standardise inside the lookup and calculation.
export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  factor: number; // Multiply by this factor to convert from -> to
}

// Global conversion ratios
export const UNIT_CONVERSIONS: { [key: string]: number } = {
  // Weights (Standard base: kg)
  'kg_to_kg': 1,
  'tonne_to_kg': 1000,
  'lbs_to_kg': 0.45359237,
  'kg_to_tonne': 0.001,
  'tonne_to_tonne': 1,
  'lbs_to_tonne': 0.00045359237,

  // Volumes (Standard base: Litre)
  'litre_to_litre': 1,
  'gallon_to_litre': 3.78541178,
  
  // Gas Volumes (Standard base: m3)
  'm3_to_m3': 1,
  'ft3_to_m3': 0.0283168466,

  // Energy (Standard base: kWh)
  'kwh_to_kwh': 1,
  'mwh_to_kwh': 1000,
};

// Help convert a quantity between units
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  if (from === to) return amount;

  const key = `${from}_to_${to}`;
  if (UNIT_CONVERSIONS[key] !== undefined) {
    return amount * UNIT_CONVERSIONS[key];
  }

  // Fallbacks or reverse lookups
  const reverseKey = `${to}_to_${from}`;
  if (UNIT_CONVERSIONS[reverseKey] !== undefined) {
    return amount / UNIT_CONVERSIONS[reverseKey];
  }

  return amount; // If no conversion matching is found, keep as is (e.g., USD spend, standard passenger-km)
}

// Default global reference emission factors
export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  // SCOPE 1 - STATIONARY COMBUSTION (Unit: kg CO2e per Litre / m3 / kg)
  {
    id: 'f_sc1_natgas_m3',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Natural Gas',
    factor: 1.88, // kg CO2e per m3
    unit: 'm3',
    source_reference: 'GHG Protocol / IPCC 2006 guidelines',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc1_natgas_ft3',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Natural Gas',
    factor: 0.053, // kg CO2e per ft3
    unit: 'ft3',
    source_reference: 'US EPA GHG Emission Factors Hub',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc1_diesel_l',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Diesel',
    factor: 2.68, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'DEFRA Greenhouse gas reporting factors',
    version: '2024.2',
    year: 2024
  },
  {
    id: 'f_sc1_diesel_gal',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Diesel',
    factor: 10.14, // kg CO2e per gallon
    unit: 'gallon',
    source_reference: 'US EPA / DEFRA',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc1_petrol_l',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Petrol',
    factor: 2.31, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'DEFRA Factors',
    version: '2024.2',
    year: 2024
  },
  {
    id: 'f_sc1_lpg_l',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'LPG',
    factor: 1.55, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'IPCC 2006 Guideline Database',
    version: '2023.1',
    year: 2023
  },
  {
    id: 'f_sc1_coal_kg',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Coal',
    factor: 2.42, // kg CO2e per kg
    unit: 'kg',
    source_reference: 'IPCC / IEA CO2 Emissions from Fuel Combustion',
    version: '2023.1',
    year: 2023
  },
  {
    id: 'f_sc1_biomass_kg',
    country: 'Global',
    category: 'Stationary Combustion',
    source: 'Biomass',
    factor: 0.12, // kg CO2e per kg (Excluding biogenic CO2, reporting CH4/N2O)
    unit: 'kg',
    source_reference: 'DEFRA / GHG Protocol biogenic standards',
    version: '2024.1',
    year: 2024
  },

  // SCOPE 1 - MOBILE COMBUSTION (Units: Litre, gallon)
  {
    id: 'f_sc1_mobile_car_petrol',
    country: 'Global',
    category: 'Mobile Combustion',
    source: 'Cars',
    factor: 2.31, // fuel based: kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'DEFRA Greenhouse gas reporting factors',
    version: '2024.2',
    year: 2024
  },
  {
    id: 'f_sc1_mobile_truck_diesel',
    country: 'Global',
    category: 'Mobile Combustion',
    source: 'Trucks',
    factor: 2.68, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'DEFRA',
    version: '2024.2',
    year: 2024
  },
  {
    id: 'f_sc1_mobile_van_petrol',
    country: 'Global',
    category: 'Mobile Combustion',
    source: 'Vans',
    factor: 2.31, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'US EPA / DEFRA',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc1_mobile_forklift_lpg',
    country: 'Global',
    category: 'Mobile Combustion',
    source: 'Forklifts',
    factor: 1.55, // kg CO2e per Litre
    unit: 'Litre',
    source_reference: 'DEFRA GHG factors',
    version: '2024.1',
    year: 2024
  },

  // SCOPE 1 - REFRIGERANTS - GLOBAL WARMING POTENTIAL (Units: kg)
  {
    id: 'f_sc1_ref_r134a',
    country: 'Global',
    category: 'Refrigerants',
    source: 'R134a',
    factor: 1430, // GWP: 1 kg refrigerant escape = 1430 kg CO2e
    unit: 'kg',
    source_reference: 'IPCC Fourth Assessment Report (AR4)',
    version: 'AR4',
    year: 2013
  },
  {
    id: 'f_sc1_ref_r410a',
    country: 'Global',
    category: 'Refrigerants',
    source: 'R410A',
    factor: 2088, // GWP
    unit: 'kg',
    source_reference: 'IPCC AR4 Greenhouse Gas GWPs',
    version: 'AR4',
    year: 2013
  },
  {
    id: 'f_sc1_ref_r22',
    country: 'Global',
    category: 'Refrigerants',
    source: 'R22',
    factor: 1810, // GWP
    unit: 'kg',
    source_reference: 'IPCC AR4 GWPs',
    version: 'AR4',
    year: 2013
  },
  {
    id: 'f_sc1_ref_r32',
    country: 'Global',
    category: 'Refrigerants',
    source: 'R32',
    factor: 675, // GWP
    unit: 'kg',
    source_reference: 'IPCC Fifth Assessment Report (AR5)',
    version: 'AR5',
    year: 2014
  },

  // SCOPE 2 - PURCHASED ELECTRICITY (Grid Emission Factors in kg CO2e per kWh)
  {
    id: 'f_sc2_elec_us',
    country: 'United States',
    category: 'Purchased Electricity',
    source: 'Electricity Grid',
    factor: 0.385, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'US EPA eGRID Factors Hub',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc2_elec_uk',
    country: 'United Kingdom',
    category: 'Purchased Electricity',
    source: 'Electricity Grid',
    factor: 0.207, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'DEFRA UK Grid carbon intensity',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc2_elec_de',
    country: 'Germany',
    category: 'Purchased Electricity',
    source: 'Electricity Grid',
    factor: 0.348, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'Federal Environment Agency (UBA) Germany',
    version: '2024',
    year: 2024
  },
  {
    id: 'f_sc2_elec_in',
    country: 'India',
    category: 'Purchased Electricity',
    source: 'Electricity Grid',
    factor: 0.713, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'Central Electricity Authority India Grid Factors',
    version: '2023',
    year: 2023
  },
  {
    id: 'f_sc2_elec_global',
    country: 'Global',
    category: 'Purchased Electricity',
    source: 'Electricity Grid',
    factor: 0.445, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'IEA (International Energy Agency) World Grid Factors',
    version: '2024',
    year: 2024
  },

  // SCOPE 3 - STANDARD REPRESENTATIVE FACTORS
  {
    id: 'f_sc3_cat1_goods_kg',
    country: 'Global',
    category: 'Category 1 Purchased Goods & Services',
    source: 'Purchased Materials (Average)',
    factor: 1.48, // kg CO2e per kg
    unit: 'kg',
    source_reference: 'GHG Protocol Scope 3 Guidance',
    version: '2023',
    year: 2023
  },
  {
    id: 'f_sc3_cat2_capital_usd',
    country: 'Global',
    category: 'Category 2 Capital Goods',
    source: 'Capital Equipment (Procurement spend)',
    factor: 0.42, // kg CO2e per USD
    unit: 'USD',
    source_reference: 'CEDA Economic Input-Output Database',
    version: 'v5.2',
    year: 2023
  },
  {
    id: 'f_sc3_cat3_fuel_kwh',
    country: 'Global',
    category: 'Category 3 Fuel and Energy Related Activities',
    source: 'Fuel & T&D Grid Losses',
    factor: 0.082, // kg CO2e per kWh
    unit: 'kWh',
    source_reference: 'DEFRA WTT & T&D factors',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat4_transport_tkm',
    country: 'Global',
    category: 'Category 4 Upstream Transportation & Distribution',
    source: 'Diesel Road Freight (Tonne-km)',
    factor: 0.165, // kg CO2e per tonne-km
    unit: 'tonne-km',
    source_reference: 'US EPA / DEFRA Freight standards',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat5_waste_landfill',
    country: 'Global',
    category: 'Category 5 Waste Generated in Operations',
    source: 'Mixed Waste to Landfill',
    factor: 432.4, // kg CO2e per tonne of waste
    unit: 'tonne',
    source_reference: 'DEFRA Waste Disposal Standards',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat5_waste_recycle',
    country: 'Global',
    category: 'Category 5 Waste Generated in Operations',
    source: 'Sorted Waste Recycled',
    factor: 21.3, // kg CO2e per tonne
    unit: 'tonne',
    source_reference: 'DEFRA Waste Standards',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat6_travel_shorthaul',
    country: 'Global',
    category: 'Category 6 Business Travel',
    source: 'Short-haul flights (<3700 km)',
    factor: 0.151, // kg CO2e per passenger-km
    unit: 'passenger-km',
    source_reference: 'DEFRA Aviation factors',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat6_travel_longhaul',
    country: 'Global',
    category: 'Category 6 Business Travel',
    source: 'Long-haul flights (>3700 km)',
    factor: 0.123, // kg CO2e per passenger-km
    unit: 'passenger-km',
    source_reference: 'DEFRA Aviation factors with radiative forcing',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat6_travel_rail',
    country: 'Global',
    category: 'Category 6 Business Travel',
    source: 'National rail passenger travel',
    factor: 0.035, // kg CO2e per passenger-km
    unit: 'passenger-km',
    source_reference: 'DEFRA Rail factors',
    version: '2024.1',
    year: 2024
  },
  {
    id: 'f_sc3_cat7_commuting_car',
    country: 'Global',
    category: 'Category 7 Employee Commuting',
    source: 'Average petrol vehicle commute',
    factor: 0.174, // kg CO2e per km
    unit: 'km',
    source_reference: 'DEFRA commuting averages',
    version: '2024.2',
    year: 2024
  },
  {
    id: 'f_sc3_cat7_commuting_transit',
    country: 'Global',
    category: 'Category 7 Employee Commuting',
    source: 'Public transit commute (Rail/Bus)',
    factor: 0.046, // kg CO2e per km
    unit: 'km',
    source_reference: 'DEFRA commuting averages',
    version: '2024.2',
    year: 2024
  }
];

// Calculation Function
export function calculateFootprint(
  amount: number,
  inputUnit: string,
  factorObj: EmissionFactor,
  isMarketBased: boolean = false
): {
  calculatedCo2e: number;
  formula: string;
} {
  // If purchased electricity and market based, and is a renewable contract, emission is 0
  if (factorObj.category === 'Purchased Electricity' && isMarketBased && factorObj.source.includes('Renewable')) {
    return {
      calculatedCo2e: 0,
      formula: `${amount} ${inputUnit} of Green Electricity x 0.00 kg CO2e/kWh (Market-Based Green Tariff) = 0.00 tCO2e`
    };
  }

  // 1. Convert input user unit to the factor standard unit
  const standardFactorUnit = factorObj.unit;
  const convertedAmount = convertUnit(amount, inputUnit, standardFactorUnit);

  // 2. Perform math: Activity data in factor unit * emission factor value
  const kgCo2e = convertedAmount * factorObj.factor;

  // 3. Convert kg to metric tonnes (tCO2e) which is the industry standard
  const tCo2e = kgCo2e / 1000;

  // Formatting strings safely
  const formattedInput = amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const formattedFactor = factorObj.factor.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const formattedResult = tCo2e.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  let formula = '';
  if (inputUnit.toLowerCase() !== standardFactorUnit.toLowerCase()) {
    // Audit trace includes unit conversion
    const convertedFormatted = convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 });
    formula = `Unit converted: ${formattedInput} ${inputUnit} -> ${convertedFormatted} ${standardFactorUnit}. Formula: ${convertedFormatted} ${standardFactorUnit} x ${formattedFactor} kg CO2e/${standardFactorUnit} = ${formattedResult} tCO2e (DIVBY 1000)`;
  } else {
    formula = `Formula: ${formattedInput} ${inputUnit} x ${formattedFactor} kg CO2e/${standardFactorUnit} = ${formattedResult} tCO2e (DIVBY 1000)`;
  }

  return {
    calculatedCo2e: Number(tCo2e.toFixed(6)),
    formula
  };
}
