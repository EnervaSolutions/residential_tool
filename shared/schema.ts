import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Projects table for managing client projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientFileNumber: text("client_file_number").notNull(),
  streetAddress: text("street_address").notNull(),
  houseType: text("house_type").notNull(),
  userInfo: text("user_info"), // Contact information
  
  // Store calculation data as JSON for each technology
  windowsData: json("windows_data"),
  doorsData: json("doors_data"),
  airSealingData: json("air_sealing_data"),
  atticInsulationData: json("attic_insulation_data"),
  dwhreData: json("dwhre_data"),
  dwhreElectricData: json("dwhre_electric_data"),
  heatPumpWaterHeaterData: json("heat_pump_water_heater_data"),
  heatPumpWaterHeaterElectricData: json("heat_pump_water_heater_electric_data"),
  heatRecoveryVentilatorData: json("heat_recovery_ventilator_data"),
  smartThermostatData: json("smart_thermostat_data"),
  groundSourceHeatPumpData: json("ground_source_heat_pump_data"),
  dmshpData: json("dmshp_data"),
  solarPvData: json("solar_pv_data"),
  ashpData: json("ashp_data"),
  
  // Project metadata
  lastModified: timestamp("last_modified").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const windowCalculations = pgTable("window_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Window Properties
  uBaseline: numeric("u_baseline", { precision: 10, scale: 2 }).notNull(),
  uUpgrade: numeric("u_upgrade", { precision: 10, scale: 2 }).notNull(),
  windowArea: numeric("window_area", { precision: 10, scale: 5 }).notNull(),
  
  // Climate Data
  heatingDegreeDays: integer("heating_degree_days").notNull(),
  coolingDegreeDays: integer("cooling_degree_days").notNull(),
  
  // Conversion Factors
  hoursPerDay: integer("hours_per_day").notNull().default(24),
  adjWindow: numeric("adj_window", { precision: 10, scale: 2 }).notNull(),
  dua: numeric("dua", { precision: 10, scale: 2 }).notNull(),
  
  // System Efficiencies
  heatingEfficiency: numeric("heating_efficiency", { precision: 10, scale: 2 }).notNull(),
  coolingEfficiency: numeric("cooling_efficiency", { precision: 10, scale: 2 }).notNull(),
  percentageAirConditioning: numeric("percentage_air_conditioning", { precision: 10, scale: 2 }).notNull(),
  
  // Conversion Factors
  whToKwh: numeric("wh_to_kwh", { precision: 10, scale: 6 }).notNull(),
  btuToKbtu: numeric("btu_to_kbtu", { precision: 10, scale: 6 }).notNull(),
  kwhToGj: numeric("kwh_to_gj", { precision: 10, scale: 6 }).notNull(),
  
  // Results
  gasSavings: numeric("gas_savings", { precision: 10, scale: 6 }).notNull(),
  electricitySavings: numeric("electricity_savings", { precision: 10, scale: 6 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doorCalculations = pgTable("door_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Door Properties
  conversionFactor: numeric("conversion_factor", { precision: 10, scale: 3 }).notNull(), // W/m²·K to BTU/h·ft²·°F
  rExisting: numeric("r_existing", { precision: 10, scale: 3 }).notNull(), // Existing door R-value
  rNew: numeric("r_new", { precision: 10, scale: 3 }).notNull(), // New door R-value
  doorAreaM2: numeric("door_area_m2", { precision: 10, scale: 2 }).notNull(), // Door area in m²
  doorAreaFt2: numeric("door_area_ft2", { precision: 10, scale: 2 }).notNull(), // Door area in ft²
  
  // Climate Data
  heatingDegreeDays: integer("heating_degree_days").notNull(),
  coolingDegreeDays: integer("cooling_degree_days").notNull(),
  
  // System Efficiencies
  heatingEfficiency: numeric("heating_efficiency", { precision: 10, scale: 2 }).notNull(),
  coolingEfficiency: numeric("cooling_efficiency", { precision: 10, scale: 2 }).notNull(), // SEER
  percentageAirConditioning: numeric("percentage_air_conditioning", { precision: 10, scale: 2 }).notNull(),
  
  // Conversion Factors
  dua: numeric("dua", { precision: 10, scale: 2 }).notNull(),
  kwhToGj: numeric("kwh_to_gj", { precision: 10, scale: 6 }).notNull(),
  
  // Results
  heatingKwh: numeric("heating_kwh", { precision: 10, scale: 6 }).notNull(),
  coolingKwh: numeric("cooling_kwh", { precision: 10, scale: 6 }).notNull(),
  gasSavings: numeric("gas_savings", { precision: 10, scale: 6 }).notNull(),
  electricitySavings: numeric("electricity_savings", { precision: 10, scale: 6 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const airSealingCalculations = pgTable("air_sealing_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Air Sealing Properties
  airChanges: numeric("air_changes", { precision: 10, scale: 2 }).notNull(), // Air changes per hour
  floorArea: numeric("floor_area", { precision: 10, scale: 2 }).notNull(), // Floor area in ft²
  ceilingHeight: numeric("ceiling_height", { precision: 10, scale: 2 }).notNull(), // Ceiling height in ft
  
  // Temperature Settings
  thermostatSetPoint: numeric("thermostat_set_point", { precision: 10, scale: 2 }).notNull(), // °F
  outsideTemperature: numeric("outside_temperature", { precision: 10, scale: 2 }).notNull(), // °F
  temperatureDifference: numeric("temperature_difference", { precision: 10, scale: 2 }).notNull(), // °F (input field)
  
  // System Properties
  heatingSystemEfficiency: numeric("heating_system_efficiency", { precision: 10, scale: 2 }).notNull(), // Decimal (0.8 for 80%)
  conversionBtuToTherms: numeric("conversion_btu_to_therms", { precision: 10, scale: 0 }).notNull().default("100000"), // BTU to Therms
  annualHoursBelowSetpoint: numeric("annual_hours_below_setpoint", { precision: 10, scale: 0 }).notNull(), // Hours
  savingsFraction: numeric("savings_fraction", { precision: 10, scale: 2 }).notNull(), // Decimal (0.1 for 10%)
  conversionThermsToGj: numeric("conversion_therms_to_gj", { precision: 10, scale: 6 }).notNull().default("0.105506"), // Therms to GJ
  
  // Results
  volumeRateInfiltration: numeric("volume_rate_infiltration", { precision: 10, scale: 6 }).notNull(), // CFM (calculated)
  gasSavings: numeric("gas_savings", { precision: 10, scale: 6 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const atticInsulationCalculations = pgTable("attic_insulation_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Insulation Properties
  percentageAirConditioning: numeric("percentage_air_conditioning", { precision: 10, scale: 2 }).notNull(), // %
  rNew: numeric("r_new", { precision: 10, scale: 2 }).notNull(), // R-value
  rOld: numeric("r_old", { precision: 10, scale: 2 }).notNull(), // R-value
  areaInsulatedAttic: numeric("area_insulated_attic", { precision: 10, scale: 2 }).notNull(), // ft²
  atticFramingFactor: numeric("attic_framing_factor", { precision: 10, scale: 2 }).notNull(), // decimal
  
  // Climate Data
  hoursPerDay: numeric("hours_per_day", { precision: 10, scale: 0 }).notNull().default("24"), // hours
  cdd: numeric("cdd", { precision: 10, scale: 0 }).notNull(), // Cooling degree days
  hdd: numeric("hdd", { precision: 10, scale: 0 }).notNull(), // Heating degree days
  
  // System Efficiencies
  discretionaryUseAdjustment: numeric("discretionary_use_adjustment", { precision: 10, scale: 2 }).notNull(), // decimal
  efficiencyAirConditioning: numeric("efficiency_air_conditioning", { precision: 10, scale: 2 }).notNull(), // SEER
  efficiencyHeatingSystem: numeric("efficiency_heating_system", { precision: 10, scale: 2 }).notNull(), // decimal
  
  // Conversion Factors
  btuToKbtu: numeric("btu_to_kbtu", { precision: 10, scale: 0 }).notNull().default("1000"), // BTU to kBTU
  btuToTherm: numeric("btu_to_therm", { precision: 10, scale: 0 }).notNull().default("100000"), // BTU to Therm
  
  // Adjustment Factors
  adjustmentCoolingSavings: numeric("adjustment_cooling_savings", { precision: 10, scale: 2 }).notNull(), // decimal
  adjustmentGasHeatingSavings: numeric("adjustment_gas_heating_savings", { precision: 10, scale: 2 }).notNull(), // decimal
  
  // Conversion Factors
  kwhToGj: numeric("kwh_to_gj", { precision: 10, scale: 6 }).notNull().default("0.0036"), // kWh to GJ
  thermToGj: numeric("therm_to_gj", { precision: 10, scale: 6 }).notNull().default("0.105506"), // Therm to GJ
  
  // Results
  electricitySavings: numeric("electricity_savings", { precision: 10, scale: 6 }).notNull(), // GJ
  gasSavings: numeric("gas_savings", { precision: 10, scale: 6 }).notNull(), // GJ
  totalSavings: numeric("total_savings", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dwhreCalculations = pgTable("dwhre_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Water Temperature Properties
  waterTempOut: numeric("water_temp_out", { precision: 10, scale: 2 }).notNull(), // °F
  waterTempIn: numeric("water_temp_in", { precision: 10, scale: 2 }).notNull(), // °F
  
  // Hot Water Usage
  dailyHotWaterUse: numeric("daily_hot_water_use", { precision: 10, scale: 2 }).notNull(), // gallons/day
  annualHotWaterUse: numeric("annual_hot_water_use", { precision: 10, scale: 2 }).notNull(), // gallons/year (calculated)
  
  // Physical Constants
  specificWeightWater: numeric("specific_weight_water", { precision: 10, scale: 2 }).notNull(), // lbs/gallon
  specificHeatWater: numeric("specific_heat_water", { precision: 10, scale: 2 }).notNull(), // Btu/lbm/°F
  
  // DWHR Properties
  practicalEffectivenessDwhr: numeric("practical_effectiveness_dwhr", { precision: 10, scale: 2 }).notNull(), // —
  recoveryEfficiencyDwhr: numeric("recovery_efficiency_dwhr", { precision: 10, scale: 2 }).notNull(), // —
  gasWaterHeaterEfficiency: numeric("gas_water_heater_efficiency", { precision: 10, scale: 2 }).notNull(), // —
  
  // Conversion Factors
  conversionBtuToTherms: numeric("conversion_btu_to_therms", { precision: 10, scale: 8 }).notNull(), // BTU to Therms
  conversionThermsToGj: numeric("conversion_therms_to_gj", { precision: 10, scale: 6 }).notNull(), // Therms to GJ
  
  // Results
  annualEnergyRecovered: numeric("annual_energy_recovered", { precision: 10, scale: 6 }).notNull(), // GJ
  annualFuelSaved: numeric("annual_fuel_saved", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dwhreElectricCalculations = pgTable("dwhre_electric_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Water Temperature Properties
  waterTempOut: numeric("water_temp_out", { precision: 10, scale: 2 }).notNull(), // °F
  waterTempIn: numeric("water_temp_in", { precision: 10, scale: 2 }).notNull(), // °F
  
  // Hot Water Usage
  dailyHotWaterUse: numeric("daily_hot_water_use", { precision: 10, scale: 2 }).notNull(), // gallons/day
  annualHotWaterUse: numeric("annual_hot_water_use", { precision: 10, scale: 2 }).notNull(), // gallons/year (calculated)
  
  // Physical Constants
  specificWeightWater: numeric("specific_weight_water", { precision: 10, scale: 2 }).notNull(), // lbs/gallon
  specificHeatWater: numeric("specific_heat_water", { precision: 10, scale: 2 }).notNull(), // Btu/lbm/°F
  
  // DWHR Properties
  practicalEffectivenessDwhr: numeric("practical_effectiveness_dwhr", { precision: 10, scale: 2 }).notNull(), // —
  recoveryEfficiencyDwhr: numeric("recovery_efficiency_dwhr", { precision: 10, scale: 2 }).notNull(), // —
  electricWaterHeaterEfficiency: numeric("electric_water_heater_efficiency", { precision: 10, scale: 2 }).notNull(), // —
  
  // Conversion Factors
  conversionBtuToTherms: numeric("conversion_btu_to_therms", { precision: 10, scale: 8 }).notNull(), // BTU to Therms
  conversionThermsToGj: numeric("conversion_therms_to_gj", { precision: 10, scale: 6 }).notNull(), // Therms to GJ
  
  // Results
  annualEnergyRecovered: numeric("annual_energy_recovered", { precision: 10, scale: 6 }).notNull(), // GJ
  annualFuelSaved: numeric("annual_fuel_saved", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const heatPumpWaterHeaterCalculations = pgTable("heat_pump_water_heater_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Water Usage and Properties
  gallonsPerDay: numeric("gallons_per_day", { precision: 10, scale: 2 }).notNull(), // gallons
  densityOfWater: numeric("density_of_water", { precision: 10, scale: 2 }).notNull(), // lb/gallon
  specificHeatOfWater: numeric("specific_heat_of_water", { precision: 10, scale: 2 }).notNull(), // BTU/lb·°F
  waterTempIntoTank: numeric("water_temp_into_tank", { precision: 10, scale: 2 }).notNull(), // °F
  waterTempExitFromTank: numeric("water_temp_exit_from_tank", { precision: 10, scale: 2 }).notNull(), // °F
  
  // Calculated Values
  waterTempRise: numeric("water_temp_rise", { precision: 10, scale: 2 }).notNull(), // °F
  kbtuReq: numeric("kbtu_req", { precision: 10, scale: 2 }).notNull(), // kBTU/year
  
  // Energy Factors
  energyFactorHeatPump: numeric("energy_factor_heat_pump", { precision: 10, scale: 2 }).notNull(), // —
  energyFactorGasWaterHeater: numeric("energy_factor_gas_water_heater", { precision: 10, scale: 2 }).notNull(), // —
  
  // Conversion Factor
  conversionKwhToGj: numeric("conversion_kwh_to_gj", { precision: 10, scale: 6 }).notNull(), // —
  
  // Results
  annualEnergySavings: numeric("annual_energy_savings", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const heatPumpWaterHeaterElectricCalculations = pgTable("heat_pump_water_heater_electric_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Water Usage and Properties
  gallonsPerDay: numeric("gallons_per_day", { precision: 10, scale: 2 }).notNull(), // gallons
  densityOfWater: numeric("density_of_water", { precision: 10, scale: 2 }).notNull(), // lb/gallon
  specificHeatOfWater: numeric("specific_heat_of_water", { precision: 10, scale: 2 }).notNull(), // BTU/lb·°F
  waterTempIntoTank: numeric("water_temp_into_tank", { precision: 10, scale: 2 }).notNull(), // °F
  waterTempExitFromTank: numeric("water_temp_exit_from_tank", { precision: 10, scale: 2 }).notNull(), // °F
  
  // Calculated Values
  waterTempRise: numeric("water_temp_rise", { precision: 10, scale: 2 }).notNull(), // °F
  kbtuReq: numeric("kbtu_req", { precision: 10, scale: 2 }).notNull(), // kBTU/year
  
  // Energy Factors
  energyFactorHeatPump: numeric("energy_factor_heat_pump", { precision: 10, scale: 2 }).notNull(), // —
  energyFactorElectricWaterHeater: numeric("energy_factor_electric_water_heater", { precision: 10, scale: 2 }).notNull(), // —
  
  // Conversion Factor
  conversionKwhToGj: numeric("conversion_kwh_to_gj", { precision: 10, scale: 6 }).notNull(), // —
  
  // Results
  annualEnergySavings: numeric("annual_energy_savings", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const heatRecoveryVentilatorCalculations = pgTable("heat_recovery_ventilator_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Flow and Air Properties
  minimumExhaustFlowRate: numeric("minimum_exhaust_flow_rate", { precision: 10, scale: 2 }).notNull(), // L/s
  specificHeatCapacityAir: numeric("specific_heat_capacity_air", { precision: 10, scale: 3 }).notNull(), // kJ/kg·K
  densityAirRoomTemperature: numeric("density_air_room_temperature", { precision: 10, scale: 3 }).notNull(), // kg/m³
  
  // Climate Data
  heatingDegreeDays: numeric("heating_degree_days", { precision: 10, scale: 2 }).notNull(), // °C·days
  conversionFactorDaysToHours: numeric("conversion_factor_days_to_hours", { precision: 10, scale: 2 }).notNull(), // —
  
  // Efficiency Values
  sensibleRecoveryEfficiencyUpgrade: numeric("sensible_recovery_efficiency_upgrade", { precision: 10, scale: 3 }).notNull(), // —
  sensibleRecoveryEfficiencyBaseline: numeric("sensible_recovery_efficiency_baseline", { precision: 10, scale: 3 }).notNull(), // —
  heatingSystemEfficiency: numeric("heating_system_efficiency", { precision: 10, scale: 3 }).notNull(), // —
  
  // Conversion Factors
  conversionLToM3: numeric("conversion_l_to_m3", { precision: 10, scale: 6 }).notNull(), // —
  conversionKjToGj: numeric("conversion_kj_to_gj", { precision: 10, scale: 9 }).notNull(), // —
  conversionHoursToSeconds: numeric("conversion_hours_to_seconds", { precision: 10, scale: 2 }).notNull(), // —
  
  // Results
  annualEnergySavingsGas: numeric("annual_energy_savings_gas", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const smartThermostatCalculations = pgTable("smart_thermostat_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Gas Usage Data
  annualNaturalGasUse: numeric("annual_natural_gas_use", { precision: 10, scale: 3 }).notNull(), // GJ
  
  // Calculated Values
  annualSpaceHeatingEnergy: numeric("annual_space_heating_energy", { precision: 10, scale: 3 }).notNull(), // GJ
  
  // Savings Factor
  savingsFactor: numeric("savings_factor", { precision: 10, scale: 3 }).notNull(), // decimal
  
  // Results
  annualEnergySavingsGas: numeric("annual_energy_savings_gas", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groundSourceHeatPumpCalculations = pgTable("ground_source_heat_pump_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // EFLH Values (Common Values)
  eflhHeating: numeric("eflh_heating", { precision: 10, scale: 2 }).notNull(), // hours
  eflhCooling: numeric("eflh_cooling", { precision: 10, scale: 2 }).notNull(), // hours
  
  // Equipment Ratings (Common Values)
  seerBase: numeric("seer_base", { precision: 10, scale: 2 }).notNull(), // ratio
  eerEfficient: numeric("eer_efficient", { precision: 10, scale: 2 }).notNull(), // ratio
  factorSeerToEer: numeric("factor_seer_to_eer", { precision: 10, scale: 2 }).notNull(), // multiplier
  kilowattConversionFactor: numeric("kilowatt_conversion_factor", { precision: 10, scale: 0 }).notNull(), // W/kW
  
  // Heat/Cool Capacity (Common Values)
  btuHeat: numeric("btu_heat", { precision: 10, scale: 2 }).notNull(), // BTU/hr
  btuCool: numeric("btu_cool", { precision: 10, scale: 2 }).notNull(), // BTU/hr
  
  // Heat Pump Ratings
  hspfBase: numeric("hspf_base", { precision: 10, scale: 2 }).notNull(), // ratio
  copEfficient: numeric("cop_efficient", { precision: 10, scale: 2 }).notNull(), // ratio
  conversionWattsToBtu: numeric("conversion_watts_to_btu", { precision: 10, scale: 3 }).notNull(), // multiplier
  
  // Results
  annualEnergySavingsGas: numeric("annual_energy_savings_gas", { precision: 10, scale: 6 }).notNull(), // GJ
  annualEnergySavingsElectricity: numeric("annual_energy_savings_electricity", { precision: 10, scale: 6 }).notNull(), // GJ
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dmshpCalculations = pgTable("dmshp_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // Natural Gas Data
  annualNaturalGasUse: numeric("annual_natural_gas_use", { precision: 10, scale: 3 }).notNull(), // GJ
  
  // Calculated Values
  annualSpaceHeatingEnergy: numeric("annual_space_heating_energy", { precision: 10, scale: 3 }).notNull(), // GJ
  
  // Equipment Data
  furnaceEfficiency: numeric("furnace_efficiency", { precision: 10, scale: 3 }).notNull(), // % (decimal)
  houseGasHeatingCapacity: numeric("house_gas_heating_capacity", { precision: 10, scale: 0 }).notNull(), // BTU/h
  houseCoolingCapacity: numeric("house_cooling_capacity", { precision: 10, scale: 0 }).notNull(), // BTU/h
  eflhHeating: numeric("eflh_heating", { precision: 10, scale: 1 }).notNull(), // hours
  eflhCooling: numeric("eflh_cooling", { precision: 10, scale: 1 }).notNull(), // hours
  
  // DMSHP Specifications
  dmshpSeer: numeric("dmshp_seer", { precision: 10, scale: 1 }).notNull(), // SEER
  dmshpHspf: numeric("dmshp_hspf", { precision: 10, scale: 1 }).notNull(), // HSPF
  dmshpFactor: numeric("dmshp_factor", { precision: 10, scale: 2 }).notNull(), // multiplier
  
  // Conversion Constants
  wToKwhConversion: numeric("w_to_kwh_conversion", { precision: 10, scale: 0 }).notNull(), // W/kW
  kwhToGjConversion: numeric("kwh_to_gj_conversion", { precision: 10, scale: 4 }).notNull(), // multiplier
  
  // Results
  annualEnergySavingsGas: numeric("annual_energy_savings_gas", { precision: 10, scale: 6 }).notNull(), // GJ
  annualEnergySavingsHeatingElectricity: numeric("annual_energy_savings_heating_electricity", { precision: 10, scale: 6 }).notNull(), // GJ (negative)
  annualEnergySavingsCoolingElectricity: numeric("annual_energy_savings_cooling_electricity", { precision: 10, scale: 6 }).notNull(), // GJ (negative)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const solarPvCalculations = pgTable("solar_pv_calculations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  
  // System Specifications
  systemSize: numeric("system_size", { precision: 10, scale: 1 }).notNull(), // kW
  arrayType: text("array_type").notNull(), // Fixed, Roof Mounted
  location: text("location").notNull(), // Lethbridge, Calgary, Edmonton, High Prairie
  
  // Array Configuration
  tilt: numeric("tilt", { precision: 10, scale: 0 }).notNull(), // degrees
  azimuth: numeric("azimuth", { precision: 10, scale: 0 }).notNull(), // degrees
  
  // Constants
  losses: numeric("losses", { precision: 10, scale: 4 }).notNull(), // decimal
  kwhToGjConversion: numeric("kwh_to_gj_conversion", { precision: 10, scale: 4 }).notNull(), // multiplier
  
  // Production Values (static based on modelling)
  annualEnergyProductionKwh: numeric("annual_energy_production_kwh", { precision: 10, scale: 0 }).notNull(), // kWh/kW
  
  // Results
  annualEnergyProductionGj: numeric("annual_energy_production_gj", { precision: 10, scale: 6 }).notNull(), // GJ/kW
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWindowCalculationSchema = createInsertSchema(windowCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  uBaseline: z.number().min(0),
  uUpgrade: z.number().min(0),
  windowArea: z.number().min(0),
  heatingDegreeDays: z.number().int().min(0),
  coolingDegreeDays: z.number().int().min(0),
  hoursPerDay: z.number().int().min(0),
  adjWindow: z.number().min(0),
  dua: z.number().min(0),
  heatingEfficiency: z.number().min(0),
  coolingEfficiency: z.number().min(0),
  percentageAirConditioning: z.number().min(0).max(100),
  whToKwh: z.number().min(0),
  btuToKbtu: z.number().min(0),
  kwhToGj: z.number().min(0),
  gasSavings: z.string(),
  electricitySavings: z.string(),
});

export const insertDoorCalculationSchema = createInsertSchema(doorCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  conversionFactor: z.number().min(0),
  rExisting: z.number().min(0),
  rNew: z.number().min(0),
  doorAreaM2: z.number().min(0),
  doorAreaFt2: z.number().min(0),
  heatingDegreeDays: z.number().int().min(0),
  coolingDegreeDays: z.number().int().min(0),
  heatingEfficiency: z.number().min(0),
  coolingEfficiency: z.number().min(0),
  percentageAirConditioning: z.number().min(0).max(100),
  dua: z.number().min(0),
  kwhToGj: z.number().min(0),
  heatingKwh: z.string(),
  coolingKwh: z.string(),
  gasSavings: z.string(),
  electricitySavings: z.string(),
});

export const insertAirSealingCalculationSchema = createInsertSchema(airSealingCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  airChanges: z.number().min(0),
  floorArea: z.number().min(0),
  ceilingHeight: z.number().min(0),
  thermostatSetPoint: z.number(),
  outsideTemperature: z.number(),
  temperatureDifference: z.number(),
  heatingSystemEfficiency: z.number().min(0).max(1),
  conversionBtuToTherms: z.number().min(0),
  annualHoursBelowSetpoint: z.number().min(0),
  savingsFraction: z.number().min(0).max(1),
  conversionThermsToGj: z.number().min(0),
  volumeRateInfiltration: z.string(),
  gasSavings: z.string(),
});

export const insertAtticInsulationCalculationSchema = createInsertSchema(atticInsulationCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  percentageAirConditioning: z.number().min(0).max(100),
  rNew: z.number().min(0),
  rOld: z.number().min(0),
  areaInsulatedAttic: z.number().min(0),
  atticFramingFactor: z.number().min(0).max(1),
  hoursPerDay: z.number().int().min(0),
  cdd: z.number().int().min(0),
  hdd: z.number().int().min(0),
  discretionaryUseAdjustment: z.number().min(0),
  efficiencyAirConditioning: z.number().min(0),
  efficiencyHeatingSystem: z.number().min(0),
  btuToKbtu: z.number().min(0),
  btuToTherm: z.number().min(0),
  adjustmentCoolingSavings: z.number().min(0),
  adjustmentGasHeatingSavings: z.number().min(0),
  kwhToGj: z.number().min(0),
  thermToGj: z.number().min(0),
  electricitySavings: z.string(),
  gasSavings: z.string(),
  totalSavings: z.string(),
});

export const insertDwhreCalculationSchema = createInsertSchema(dwhreCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  waterTempOut: z.number().min(0),
  waterTempIn: z.number().min(0),
  dailyHotWaterUse: z.number().min(0),
  annualHotWaterUse: z.number().min(0),
  specificWeightWater: z.number().min(0),
  specificHeatWater: z.number().min(0),
  practicalEffectivenessDwhr: z.number().min(0).max(1),
  recoveryEfficiencyDwhr: z.number().min(0).max(1),
  gasWaterHeaterEfficiency: z.number().min(0).max(1),
  conversionBtuToTherms: z.number().min(0),
  conversionThermsToGj: z.number().min(0),
  annualEnergyRecovered: z.string(),
  annualFuelSaved: z.string(),
});

export const insertDwhreElectricCalculationSchema = createInsertSchema(dwhreElectricCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  waterTempOut: z.number().min(0),
  waterTempIn: z.number().min(0),
  dailyHotWaterUse: z.number().min(0),
  annualHotWaterUse: z.number().min(0),
  specificWeightWater: z.number().min(0),
  specificHeatWater: z.number().min(0),
  practicalEffectivenessDwhr: z.number().min(0).max(1),
  recoveryEfficiencyDwhr: z.number().min(0).max(1),
  electricWaterHeaterEfficiency: z.number().min(0).max(1),
  conversionBtuToTherms: z.number().min(0),
  conversionThermsToGj: z.number().min(0),
  annualEnergyRecovered: z.string(),
  annualFuelSaved: z.string(),
});

export const insertHeatPumpWaterHeaterCalculationSchema = createInsertSchema(heatPumpWaterHeaterCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  gallonsPerDay: z.number().min(0),
  densityOfWater: z.number().min(0),
  specificHeatOfWater: z.number().min(0),
  waterTempIntoTank: z.number().min(0),
  waterTempExitFromTank: z.number().min(0),
  waterTempRise: z.number().min(0),
  kbtuReq: z.number().min(0),
  energyFactorHeatPump: z.number().min(0),
  energyFactorGasWaterHeater: z.number().min(0).max(1),
  conversionKwhToGj: z.number().min(0),
  annualEnergySavings: z.string(),
});

export const insertHeatPumpWaterHeaterElectricCalculationSchema = createInsertSchema(heatPumpWaterHeaterElectricCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  gallonsPerDay: z.number().min(0),
  densityOfWater: z.number().min(0),
  specificHeatOfWater: z.number().min(0),
  waterTempIntoTank: z.number().min(0),
  waterTempExitFromTank: z.number().min(0),
  waterTempRise: z.number().min(0),
  kbtuReq: z.number().min(0),
  energyFactorHeatPump: z.number().min(0),
  energyFactorElectricWaterHeater: z.number().min(0).max(1),
  conversionKwhToGj: z.number().min(0),
  annualEnergySavings: z.string(),
});

export const insertHeatRecoveryVentilatorCalculationSchema = createInsertSchema(heatRecoveryVentilatorCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  minimumExhaustFlowRate: z.number().min(0),
  specificHeatCapacityAir: z.number().min(0),
  densityAirRoomTemperature: z.number().min(0),
  heatingDegreeDays: z.number().min(0),
  conversionFactorDaysToHours: z.number().min(0),
  sensibleRecoveryEfficiencyUpgrade: z.number().min(0).max(1),
  sensibleRecoveryEfficiencyBaseline: z.number().min(0).max(1),
  heatingSystemEfficiency: z.number().min(0).max(1),
  conversionLToM3: z.number().min(0),
  conversionKjToGj: z.number().min(0),
  conversionHoursToSeconds: z.number().min(0),
  annualEnergySavingsGas: z.string(),
});

export const insertSmartThermostatCalculationSchema = createInsertSchema(smartThermostatCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  annualNaturalGasUse: z.number().min(0),
  annualSpaceHeatingEnergy: z.number().min(0),
  savingsFactor: z.number().min(0).max(1),
  annualEnergySavingsGas: z.string(),
});

export const insertGroundSourceHeatPumpCalculationSchema = createInsertSchema(groundSourceHeatPumpCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  eflhHeating: z.number().min(0),
  eflhCooling: z.number().min(0),
  seerBase: z.number().min(0),
  eerEfficient: z.number().min(0),
  factorSeerToEer: z.number().min(0),
  kilowattConversionFactor: z.number().min(0),
  btuHeat: z.number().min(0),
  btuCool: z.number().min(0),
  hspfBase: z.number().min(0),
  copEfficient: z.number().min(0),
  conversionWattsToBtu: z.number().min(0),
  annualEnergySavingsGas: z.string(),
  annualEnergySavingsElectricity: z.string(),
});

export const insertDmshpCalculationSchema = createInsertSchema(dmshpCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  annualNaturalGasUse: z.number().min(0),
  annualSpaceHeatingEnergy: z.number().min(0),
  furnaceEfficiency: z.number().min(0),
  houseGasHeatingCapacity: z.number().min(0),
  houseCoolingCapacity: z.number().min(0),
  eflhHeating: z.number().min(0),
  eflhCooling: z.number().min(0),
  dmshpSeer: z.number().min(0),
  dmshpHspf: z.number().min(0),
  dmshpFactor: z.number().min(0),
  wToKwhConversion: z.number().min(0),
  kwhToGjConversion: z.number().min(0),
  annualEnergySavingsGas: z.string(),
  annualEnergySavingsHeatingElectricity: z.string(),
  annualEnergySavingsCoolingElectricity: z.string(),
});

export const insertSolarPvCalculationSchema = createInsertSchema(solarPvCalculations).omit({
  id: true,
  createdAt: true,
}).extend({
  // Override numeric fields to accept numbers instead of strings for form validation
  systemSize: z.number().min(0),
  tilt: z.number().min(0).max(90),
  azimuth: z.number().min(0).max(360),
  losses: z.number().min(0).max(1),
  kwhToGjConversion: z.number().min(0),
  annualEnergyProductionKwh: z.number().min(0),
  annualEnergyProductionGj: z.string(),
});

// Project schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type WindowCalculation = typeof windowCalculations.$inferSelect;
export type InsertWindowCalculation = z.infer<typeof insertWindowCalculationSchema>;
export type DoorCalculation = typeof doorCalculations.$inferSelect;
export type InsertDoorCalculation = z.infer<typeof insertDoorCalculationSchema>;
export type AirSealingCalculation = typeof airSealingCalculations.$inferSelect;
export type InsertAirSealingCalculation = z.infer<typeof insertAirSealingCalculationSchema>;
export type AtticInsulationCalculation = typeof atticInsulationCalculations.$inferSelect;
export type InsertAtticInsulationCalculation = z.infer<typeof insertAtticInsulationCalculationSchema>;
export type DmshpCalculation = typeof dmshpCalculations.$inferSelect;
export type InsertDmshpCalculation = z.infer<typeof insertDmshpCalculationSchema>;
export type SolarPvCalculation = typeof solarPvCalculations.$inferSelect;
export type InsertSolarPvCalculation = z.infer<typeof insertSolarPvCalculationSchema>;

// Audio recordings table
export const audioRecordings = pgTable("audio_recordings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  audioData: text("audio_data").notNull(), // Base64 encoded audio data
  duration: integer("duration"), // Duration in seconds
  mimeType: text("mime_type").notNull(), // Audio MIME type (e.g., audio/wav, audio/mp3)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAudioRecordingSchema = createInsertSchema(audioRecordings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAudioRecording = z.infer<typeof insertAudioRecordingSchema>;
export type AudioRecording = typeof audioRecordings.$inferSelect;
