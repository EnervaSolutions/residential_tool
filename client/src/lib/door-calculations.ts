export interface DoorCalculationInputs {
  conversionFactor: number; // W/m²·K to BTU/h·ft²·°F
  rExisting: number; // Existing door R-value
  rNew: number; // New door R-value
  doorAreaM2: number; // Door area in m²
  doorAreaFt2: number; // Door area in ft² (calculated)
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  heatingEfficiency: number;
  coolingEfficiency: number; // SEER
  percentageAirConditioning: number;
  dua: number;
  kwhToGj: number;
}

export interface DoorCalculationResults {
  heatingKwh: number;
  coolingKwh: number;
  gasSavings: number;
  electricitySavings: number;
  rExisting: number; // Calculated R-value for existing door
  rNew: number; // Calculated R-value for new door
}

export function calculateDoorSavings(inputs: DoorCalculationInputs): DoorCalculationResults {
  const {
    conversionFactor,
    doorAreaFt2,
    heatingDegreeDays,
    coolingDegreeDays,
    heatingEfficiency,
    coolingEfficiency,
    percentageAirConditioning,
    dua,
    kwhToGj
  } = inputs;

  // Calculate R-values based on conversion factor (these should be dynamic, not fixed inputs)
  // R_existing = 1 / (2 / conversionFactor) - from Alberta Building Code min USI = 2
  const rExisting = 1 / (2 / conversionFactor);
  
  // R_new = 1 / 0.21 - from NRCan Requirement (this could be made dynamic too)
  const rNew = 1 / 0.21;

  // Heating Energy Savings (kWh): ((1/R_existing - 1/R_new) * Area_ft2 * HDD * 24) / (3412 * Heating_Efficiency)
  const heatingKwh = ((1/rExisting - 1/rNew) * doorAreaFt2 * heatingDegreeDays * 24) / (3412 * heatingEfficiency);

  // Cooling Energy Savings (kWh): ((1/R_existing - 1/R_new) * Area_ft2 * CDD * 24 * %AC) / (1000 * SEER)
  const coolingKwh = ((1/rExisting - 1/rNew) * doorAreaFt2 * coolingDegreeDays * 24 * (percentageAirConditioning / 100)) / (1000 * coolingEfficiency);

  // Annual Energy Savings - Gas (GJ): Heating_kWh × Conversion_to_GJ
  const gasSavings = heatingKwh * kwhToGj;

  // Annual Energy Savings - Electricity (GJ): Cooling_kWh × Conversion_to_GJ × DUA
  const electricitySavings = coolingKwh * kwhToGj * dua;

  return {
    heatingKwh,
    coolingKwh,
    gasSavings,
    electricitySavings,
    // Return calculated R-values for display
    rExisting,
    rNew
  };
}