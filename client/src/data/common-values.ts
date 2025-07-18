// Common values for energy efficiency calculations based on Iowa TRM and industry standards

export const CLIMATE_VALUES = [
  {
    category: "Climate Factors",
    variable: "EFLI_heating",
    value: 1998,
    unit: "hr",
    additionalInfo: "Source: Internal Residential Modelling for Climate Zone 7A. Wisconsin has a value of 1158 hours, and Edmonton is in a colder climate zone"
  },
  {
    category: "Climate Factors", 
    variable: "EFLI_cooling",
    value: 1161,
    unit: "hr",
    additionalInfo: "Source: Internal Residential Modelling for Climate Zone 7A. When using a study from ACEEE and a design temperature of 32°C, the EFLI is found to be 986 hours."
  },
  {
    category: "Climate Factors",
    variable: "Heating Degree Days (HDD)",
    value: 9166,
    unit: "F-d",
    additionalInfo: "Source: NASA"
  },
  {
    category: "Climate Factors",
    variable: "Cooling Degree Days (CDD)",
    value: 1232,
    unit: "F-d", 
    additionalInfo: "Source: NASA"
  },
  {
    category: "Climate Factors",
    variable: "Average temperature during heating season",
    value: -10.4,
    unit: "degree C",
    additionalInfo: "Source: ASHRAE"
  },
  {
    category: "Climate Factors",
    variable: "Average temperature during cooling season", 
    value: 27,
    unit: "degree C",
    additionalInfo: "Source: ASHRAE"
  }
];

export const EQUIPMENT_VALUES = [
  {
    category: "Equipment Assumptions",
    variable: "Heating Efficiency of Existing Standard Space Heating System",
    value: 80,
    unit: "%",
    additionalInfo: "Source: 2024 Illinois Statewide Technical Reference Manual for Energy Efficiency Version 12.0 Volume 3: Residential Measures. Page 160; Enbridge TRM Page 40. EnerCan standard is 90%."
  },
  {
    category: "Equipment Assumptions", 
    variable: "Energy Factor of Existing Standard Water Heating System",
    value: 0.58,
    unit: "",
    additionalInfo: "Source: Enbridge TRM Page 31. Uniform Energy Factor is calculated to 0.62*, the capacity (in gallons) of the storage tank. 50 Gallons Water Tank is assumed"
  },
  {
    category: "Equipment Assumptions",
    variable: "Energy Factor of Existing Standard Water Heating System (Electric)",
    value: 0.90,
    unit: "",
    additionalInfo: "Source: NRCan Electric Water Heaters, average of the Uniform Energy Factor for a 50 Gallon Water heater under Indoor Electric Water Draw Test"
  },
  {
    category: "Equipment Assumptions",
    variable: "Efficiency of Air Conditioning", 
    value: 13.40,
    unit: "SEER",
    additionalInfo: "Source: 2024 Illinois Statewide Technical Reference Manual for Energy Efficiency Version 12.0 Volume 3: Residential Measures. Page 127; other sources have the SEER of 9.5 on Page 423"
  },
  {
    category: "Equipment Assumptions",
    variable: "Percentage of Air Conditioning",
    value: 37,
    unit: "%", 
    additionalInfo: "Source: StatsCan https://www150.statcan.gc.ca/t1/tbl1/en/cv.action?pid=3810001901"
  },
  {
    category: "Equipment Assumptions",
    variable: "Annual Natural Gas Consumption",
    value: 109.3,
    unit: "GJ",
    additionalInfo: "Source: StatsCan national average energy consumption, Canada and provinces"
  },
  {
    category: "Equipment Assumptions",
    variable: "House Gas Heating Capacity",
    value: 0.08,
    unit: "MBTU/hr",
    additionalInfo: "Default assumption Page 163. 80000 BTU is also common to heat up a house around 2000 ft2; similar to the Size of House assumption"
  },
  {
    category: "Equipment Assumptions", 
    variable: "House Cooling Capacity",
    value: 36000,
    unit: "BTU/hr",
    additionalInfo: "Source: 2021 ASHRAE Handbook Fundamentals Chapter 17 - Residential Cooling System Size"
  }
];

export const BUILDING_VALUES = [
  {
    category: "Building Dimensions",
    variable: "Average Height of each Floor",
    value: 9,
    unit: "ft",
    additionalInfo: ""
  },
  {
    category: "Building Dimensions",
    variable: "Size of House", 
    value: 191,
    unit: "m2",
    additionalInfo: "Source: Edmonton's Green Home Guide https://www.edmonton.ca/public-files/assets/document?path=Green-Guide-Home#search%3DGreenGuide%2520%252D%2520Ed%252D%2520%252028%25CE%25B7%2520%25CE%25B7%2520%25CE%25B7%25CE%25B7%2520%25CE%25B7%2520%25C2%25BD%2520%25C2%25B7%2520%25C2%25B7%25E2%2580%25B5%2520%25C2%25BD%2520%25E2%2580%25B5%2520%25CE%25B7%2520%25C2%25B7%2520%25C2%25B7%2520%25C2%25B5 - Canada Home"
  }
];

export const WINDOW_DOOR_VALUES = [
  {
    category: "Windows & Doors",
    variable: "U-Value Baseline Window",
    value: 3.4,
    unit: "W/m²K",
    additionalInfo: "Typical single-pane window U-value"
  },
  {
    category: "Windows & Doors", 
    variable: "U-Value ENERGY STAR Window",
    value: 1.6,
    unit: "W/m²K",
    additionalInfo: "ENERGY STAR certified window requirement"
  },
  {
    category: "Windows & Doors",
    variable: "U-Value Baseline Door",
    value: 2.8,
    unit: "W/m²K", 
    additionalInfo: "Typical baseline door U-value"
  },
  {
    category: "Windows & Doors",
    variable: "U-Value ENERGY STAR Door", 
    value: 1.8,
    unit: "W/m²K",
    additionalInfo: "ENERGY STAR certified door requirement"
  }
];

export const WATER_HEATING_VALUES = [
  {
    category: "Water Heating",
    variable: "Hot Water Temperature",
    value: 60,
    unit: "°C",
    additionalInfo: "Standard hot water delivery temperature"
  },
  {
    category: "Water Heating",
    variable: "Cold Water Temperature", 
    value: 10,
    unit: "°C",
    additionalInfo: "Typical cold water supply temperature"
  },
  {
    category: "Water Heating",
    variable: "Daily Hot Water Usage",
    value: 225,
    unit: "L/day",
    additionalInfo: "Average household hot water consumption"
  },
  {
    category: "Water Heating",
    variable: "Heat Pump Water Heater COP",
    value: 2.0,
    unit: "",
    additionalInfo: "ENERGY STAR minimum coefficient of performance"
  }
];

// Technology-specific common values
export const getCommonValues = (technology: string) => {
  const baseValues = [...CLIMATE_VALUES, ...EQUIPMENT_VALUES, ...BUILDING_VALUES];
  
  switch (technology) {
    case 'windows':
    case 'doors':
      return [...baseValues, ...WINDOW_DOOR_VALUES];
    case 'water-heating':
    case 'heat-pump-water-heater':
    case 'dwhr':
      return [...baseValues, ...WATER_HEATING_VALUES];
    default:
      return baseValues;
  }
};