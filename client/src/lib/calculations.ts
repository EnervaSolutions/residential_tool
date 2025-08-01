export interface CalculationInputs {
  uBaseline: number;
  uUpgrade: number;
  windowArea: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  hoursPerDay: number;
  adjWindow: number;
  dua: number;
  heatingEfficiency: number;
  coolingEfficiency: number;
  percentageAirConditioning: number;
  whToKwh: number;
  btuToKbtu: number;
  kwhToGj: number;
}
// Editable ASHP calculation inputs
export interface ASHPCalculationInputs {
  eflhHeating: number;
  eflhCooling: number;
  btuhcExist: number;
  seerExist: number;
  btuhcEE: number;
  btuhhExist: number;
  btuhhEE: number;
  furnanceEfficieny: number;
  annualNaturalGasUsage: number;
  annualHeatingEnergy: number;
}

// Constants for ASHP calculations
export interface ASHPConstants {
  seerRR: number;
  hspfExist: number;
  hspFee: number;
  furnanceUsageFactor: number;
  adjustmentFactor: number;
  heatingDiversityFactor: number;
  wToKwh: number;
  kwhToGj: number;
}

// Combined interface for calculations
export interface ASHPCalculationData extends ASHPCalculationInputs, ASHPConstants {}

export interface ASHPCalculationResults {
  gasSavings: number;
  electricitySavings: number;
}

export interface CalculationResults {
  gasSavings: number;
  electricitySavings: number;
  deltaU: number;
}

export function calculateASHPSavings(inputs: ASHPCalculationData): ASHPCalculationResults {
  const {
  eflhHeating, // C19
  eflhCooling, // C20
  btuhcExist, // C21
  seerExist, // C22
  btuhcEE, // C23
  seerRR, // C24
  btuhhExist, // C25
  btuhhEE, // C26
  hspfExist, // C27
  hspFee, // C28
  furnanceEfficieny, // C29
  annualNaturalGasUsage, // C30
  furnanceUsageFactor, // C31
  annualHeatingEnergy, // C32
  adjustmentFactor, // C33
  heatingDiversityFactor, // C34
  wToKwh, // C35
  kwhToGj // C36
  } = inputs;

  // Annual Energy Savings - Gas (GJ)
  // Formula: anuualHeatingEnergy * (1 - furnanceUsageFactor)
  const gasSavings = annualHeatingEnergy * (1 - furnanceUsageFactor)

  // Annual Energy Savings - Electricity (GJ)
  // const result = ((C21 * C20) / C22 / C35 * C36) - ((C23 * C20) / C24 / C35 * C36) - ((C26 * C19) / C28 * C36 / C35);

  const electricitySavings = ((btuhcExist * eflhCooling / seerExist / wToKwh * kwhToGj) - ((btuhcEE * eflhCooling) / seerRR / wToKwh * kwhToGj) - ((btuhhEE * eflhHeating) / hspFee * (kwhToGj / wToKwh)));

  return {
    gasSavings,
    electricitySavings
  };
}


export function calculateWindowSavings(inputs: CalculationInputs): CalculationResults {
  const {
    uBaseline,
    uUpgrade,
    windowArea,
    heatingDegreeDays,
    coolingDegreeDays,
    hoursPerDay,
    adjWindow,
    dua,
    heatingEfficiency,
    coolingEfficiency,
    percentageAirConditioning,
    whToKwh,
    btuToKbtu,
    kwhToGj
  } = inputs;

  const deltaU = uBaseline - uUpgrade;

  // Heating Savings = ((Ubaseline - Uupgrade) * AreaWindow * HDD * 24 * ADJwindow * ConversionfromkWhtoGJ * ConversionfromWhtokWh)) / EfficiencyofHeatingSystem
  const gasSavings = ((deltaU * windowArea * heatingDegreeDays * hoursPerDay * adjWindow * kwhToGj * whToKwh)) / (heatingEfficiency / 100);

  // Cooling Savings = ((Ubaseline - Uupgrade) * AreaWindow * CDD * 24 * ADJwindow * ConversionfromkWhtoGJ * ConversionfromWhtokWh * DUA * %AirConditioning) / (Conversion from Btu to kBtu * EfficiencyofCoolingSystem)
  // The correct denominator is SEER * 0.63 based on the Iowa TRM formula requirements
  const electricitySavings = ((deltaU * windowArea * coolingDegreeDays * hoursPerDay * adjWindow * kwhToGj * whToKwh * dua * (percentageAirConditioning / 100))) / (coolingEfficiency * 0.63);

  return {
    gasSavings,
    electricitySavings,
    deltaU
  };
}

// Air Sealing Calculation Types and Functions
export interface AirSealingCalculationInputs {
  airChanges: number;
  floorArea: number;
  ceilingHeight: number;
  thermostatSetPoint: number;
  outsideTemperature: number;
  temperatureDifference: number;
  heatingSystemEfficiency: number;
  conversionBtuToTherms: number;
  annualHoursBelowSetpoint: number;
  savingsFraction: number;
  conversionThermsToGj: number;
}

export interface AirSealingCalculationResults {
  volumeRateInfiltration: number;
  gasSavings: number;
}

export function calculateAirSealingSavings(inputs: AirSealingCalculationInputs): AirSealingCalculationResults {
  const {
    airChanges,
    floorArea,
    ceilingHeight,
    temperatureDifference,
    heatingSystemEfficiency,
    conversionBtuToTherms,
    annualHoursBelowSetpoint,
    savingsFraction,
    conversionThermsToGj
  } = inputs;

  // Calculate Volume Rate of Infiltration by Air (CFM)
  // Formula: = airChanges × floorArea × ceilingHeight / 60
  const volumeRateInfiltration = (airChanges * floorArea * ceilingHeight) / 60;

  // Calculate Annual Energy Savings - Gas (GJ)
  // Formula: (1.08 × Volume Rate of Infiltration × Temperature Difference ÷ (Heating System Efficiency × Conversion Factor from BTU to Therms)) × Annual Hours × Savings Fraction × Conversion Factor from Therms to GJ
  const gasSavings = (1.08 * volumeRateInfiltration * temperatureDifference / (heatingSystemEfficiency * conversionBtuToTherms)) * annualHoursBelowSetpoint * savingsFraction * conversionThermsToGj;

  return {
    volumeRateInfiltration,
    gasSavings
  };
}

// Attic Insulation Calculation Types and Functions
export interface AtticInsulationCalculationInputs {
  percentageAirConditioning: number;
  rNew: number;
  rOld: number;
  areaInsulatedAttic: number;
  atticFramingFactor: number;
  hoursPerDay: number;
  cdd: number;
  hdd: number;
  discretionaryUseAdjustment: number;
  efficiencyAirConditioning: number;
  efficiencyHeatingSystem: number;
  btuToKbtu: number;
  btuToTherm: number;
  adjustmentCoolingSavings: number;
  adjustmentGasHeatingSavings: number;
  kwhToGj: number;
  thermToGj: number;
}

export interface AtticInsulationCalculationResults {
  electricitySavings: number;
  gasSavings: number;
  totalSavings: number;
}

export function calculateAtticInsulationSavings(inputs: AtticInsulationCalculationInputs): AtticInsulationCalculationResults {
  const {
    percentageAirConditioning,
    rNew,
    rOld,
    areaInsulatedAttic,
    atticFramingFactor,
    hoursPerDay,
    cdd,
    hdd,
    discretionaryUseAdjustment,
    efficiencyAirConditioning,
    efficiencyHeatingSystem,
    btuToKbtu,
    btuToTherm,
    adjustmentCoolingSavings,
    adjustmentGasHeatingSavings,
    kwhToGj,
    thermToGj
  } = inputs;

  // Calculate R-value difference (corrected formula: 1/R_Old - 1/R_New)
  const rDelta = (1 / rOld) - (1 / rNew);
  
  // Calculate effective area (accounting for framing factor)
  const effectiveArea = areaInsulatedAttic * (1 - atticFramingFactor);
  
  // Calculate Annual Energy Savings - Electric Cooling (GJ)
  // Formula: (((((1/R Old-1/R New)*Area of Insulated Attic *(1-Attic Framing Factor))*CDD*Discretionary Use Adjustment*Number of hours in a day)/(1000*Efficiency of Air Conditioning))*Percentage of Air Conditioning )*kWh to GJ
  const coolingEnergyKwh = (((rDelta * effectiveArea) * cdd * discretionaryUseAdjustment * hoursPerDay) / (btuToKbtu * efficiencyAirConditioning)) * (percentageAirConditioning / 100);
  const electricitySavings = coolingEnergyKwh * kwhToGj;
  
  // Calculate Annual Energy Savings - Gas Heating (GJ)
  // Formula: ((((1/R Old-1/R New)*Area of Insulated Attic*(1-Attic Framing Factor))*Number of hours in a day*HDD)/(Efficiency of heating system*BTU to Therm)*Adjustment for gas heating savings)*Therm to GJ
  const heatingEnergyTherms = (((rDelta * effectiveArea) * hoursPerDay * hdd) / (efficiencyHeatingSystem * btuToTherm)) * adjustmentGasHeatingSavings;
  const gasSavings = heatingEnergyTherms * thermToGj;
  
  // Calculate total savings
  const totalSavings = electricitySavings + gasSavings;

  return {
    electricitySavings,
    gasSavings,
    totalSavings
  };
}
