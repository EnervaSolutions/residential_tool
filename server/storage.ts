import { users, windowCalculations, doorCalculations, airSealingCalculations, atticInsulationCalculations, projects, audioRecordings, type User, type InsertUser, type WindowCalculation, type InsertWindowCalculation, type DoorCalculation, type InsertDoorCalculation, type AirSealingCalculation, type InsertAirSealingCalculation, type AtticInsulationCalculation, type InsertAtticInsulationCalculation, type Project, type InsertProject, type AudioRecording, type InsertAudioRecording } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Window calculations
  createWindowCalculation(calculation: InsertWindowCalculation): Promise<WindowCalculation>;
  getWindowCalculations(): Promise<WindowCalculation[]>;
  getWindowCalculation(id: number): Promise<WindowCalculation | undefined>;
  updateWindowCalculation(id: number, calculation: Partial<InsertWindowCalculation>): Promise<WindowCalculation | undefined>;
  deleteWindowCalculation(id: number): Promise<boolean>;
  
  // Door calculations
  createDoorCalculation(calculation: InsertDoorCalculation): Promise<DoorCalculation>;
  getDoorCalculations(): Promise<DoorCalculation[]>;
  getDoorCalculation(id: number): Promise<DoorCalculation | undefined>;
  updateDoorCalculation(id: number, calculation: Partial<InsertDoorCalculation>): Promise<DoorCalculation | undefined>;
  deleteDoorCalculation(id: number): Promise<boolean>;
  
  // Air sealing calculations
  createAirSealingCalculation(calculation: InsertAirSealingCalculation): Promise<AirSealingCalculation>;
  getAirSealingCalculations(): Promise<AirSealingCalculation[]>;
  getAirSealingCalculation(id: number): Promise<AirSealingCalculation | undefined>;
  updateAirSealingCalculation(id: number, calculation: Partial<InsertAirSealingCalculation>): Promise<AirSealingCalculation | undefined>;
  deleteAirSealingCalculation(id: number): Promise<boolean>;
  
  // Attic insulation calculations
  createAtticInsulationCalculation(calculation: InsertAtticInsulationCalculation): Promise<AtticInsulationCalculation>;
  getAtticInsulationCalculations(): Promise<AtticInsulationCalculation[]>;
  getAtticInsulationCalculation(id: number): Promise<AtticInsulationCalculation | undefined>;
  updateAtticInsulationCalculation(id: number, calculation: Partial<InsertAtticInsulationCalculation>): Promise<AtticInsulationCalculation | undefined>;
  deleteAtticInsulationCalculation(id: number): Promise<boolean>;
  
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Audio recordings
  createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording>;
  getAudioRecordings(projectId: number): Promise<AudioRecording[]>;
  getAudioRecording(id: number): Promise<AudioRecording | undefined>;
  updateAudioRecording(id: number, recording: Partial<InsertAudioRecording>): Promise<AudioRecording | undefined>;
  deleteAudioRecording(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createWindowCalculation(calculation: InsertWindowCalculation): Promise<WindowCalculation> {
    // Convert numeric values to strings for database storage
    const dbValues = {
      ...calculation,
      uBaseline: calculation.uBaseline.toString(),
      uUpgrade: calculation.uUpgrade.toString(),
      windowArea: calculation.windowArea.toString(),
      adjWindow: calculation.adjWindow.toString(),
      dua: calculation.dua.toString(),
      heatingEfficiency: calculation.heatingEfficiency.toString(),
      coolingEfficiency: calculation.coolingEfficiency.toString(),
      percentageAirConditioning: calculation.percentageAirConditioning.toString(),
      whToKwh: calculation.whToKwh.toString(),
      btuToKbtu: calculation.btuToKbtu.toString(),
      kwhToGj: calculation.kwhToGj.toString(),
    };
    
    const [result] = await db
      .insert(windowCalculations)
      .values(dbValues)
      .returning();
    return result;
  }

  async getWindowCalculations(): Promise<WindowCalculation[]> {
    return await db
      .select()
      .from(windowCalculations)
      .orderBy(desc(windowCalculations.createdAt));
  }

  async getWindowCalculation(id: number): Promise<WindowCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(windowCalculations)
      .where(eq(windowCalculations.id, id));
    return calculation || undefined;
  }

  async updateWindowCalculation(id: number, calculation: Partial<InsertWindowCalculation>): Promise<WindowCalculation | undefined> {
    // Convert numeric values to strings for database storage
    const dbValues: any = { ...calculation };
    if (calculation.uBaseline !== undefined) dbValues.uBaseline = calculation.uBaseline.toString();
    if (calculation.uUpgrade !== undefined) dbValues.uUpgrade = calculation.uUpgrade.toString();
    if (calculation.windowArea !== undefined) dbValues.windowArea = calculation.windowArea.toString();
    if (calculation.adjWindow !== undefined) dbValues.adjWindow = calculation.adjWindow.toString();
    if (calculation.dua !== undefined) dbValues.dua = calculation.dua.toString();
    if (calculation.heatingEfficiency !== undefined) dbValues.heatingEfficiency = calculation.heatingEfficiency.toString();
    if (calculation.coolingEfficiency !== undefined) dbValues.coolingEfficiency = calculation.coolingEfficiency.toString();
    if (calculation.percentageAirConditioning !== undefined) dbValues.percentageAirConditioning = calculation.percentageAirConditioning.toString();
    if (calculation.whToKwh !== undefined) dbValues.whToKwh = calculation.whToKwh.toString();
    if (calculation.btuToKbtu !== undefined) dbValues.btuToKbtu = calculation.btuToKbtu.toString();
    if (calculation.kwhToGj !== undefined) dbValues.kwhToGj = calculation.kwhToGj.toString();

    const [updated] = await db
      .update(windowCalculations)
      .set(dbValues)
      .where(eq(windowCalculations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWindowCalculation(id: number): Promise<boolean> {
    const result = await db
      .delete(windowCalculations)
      .where(eq(windowCalculations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createDoorCalculation(calculation: InsertDoorCalculation): Promise<DoorCalculation> {
    // Convert numeric values to strings for database storage
    const dbValues = {
      ...calculation,
      conversionFactor: calculation.conversionFactor.toString(),
      rExisting: calculation.rExisting.toString(),
      rNew: calculation.rNew.toString(),
      doorAreaM2: calculation.doorAreaM2.toString(),
      doorAreaFt2: calculation.doorAreaFt2.toString(),
      heatingEfficiency: calculation.heatingEfficiency.toString(),
      coolingEfficiency: calculation.coolingEfficiency.toString(),
      percentageAirConditioning: calculation.percentageAirConditioning.toString(),
      dua: calculation.dua.toString(),
      kwhToGj: calculation.kwhToGj.toString(),
    };
    
    const [result] = await db
      .insert(doorCalculations)
      .values(dbValues)
      .returning();
    return result;
  }

  async getDoorCalculations(): Promise<DoorCalculation[]> {
    return await db
      .select()
      .from(doorCalculations)
      .orderBy(desc(doorCalculations.createdAt));
  }

  async getDoorCalculation(id: number): Promise<DoorCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(doorCalculations)
      .where(eq(doorCalculations.id, id));
    return calculation || undefined;
  }

  async updateDoorCalculation(id: number, calculation: Partial<InsertDoorCalculation>): Promise<DoorCalculation | undefined> {
    // Convert numeric values to strings for database storage
    const dbValues: any = { ...calculation };
    if (calculation.conversionFactor !== undefined) dbValues.conversionFactor = calculation.conversionFactor.toString();
    if (calculation.rExisting !== undefined) dbValues.rExisting = calculation.rExisting.toString();
    if (calculation.rNew !== undefined) dbValues.rNew = calculation.rNew.toString();
    if (calculation.doorAreaM2 !== undefined) dbValues.doorAreaM2 = calculation.doorAreaM2.toString();
    if (calculation.doorAreaFt2 !== undefined) dbValues.doorAreaFt2 = calculation.doorAreaFt2.toString();
    if (calculation.heatingEfficiency !== undefined) dbValues.heatingEfficiency = calculation.heatingEfficiency.toString();
    if (calculation.coolingEfficiency !== undefined) dbValues.coolingEfficiency = calculation.coolingEfficiency.toString();
    if (calculation.percentageAirConditioning !== undefined) dbValues.percentageAirConditioning = calculation.percentageAirConditioning.toString();
    if (calculation.dua !== undefined) dbValues.dua = calculation.dua.toString();
    if (calculation.kwhToGj !== undefined) dbValues.kwhToGj = calculation.kwhToGj.toString();

    const [updated] = await db
      .update(doorCalculations)
      .set(dbValues)
      .where(eq(doorCalculations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDoorCalculation(id: number): Promise<boolean> {
    const result = await db
      .delete(doorCalculations)
      .where(eq(doorCalculations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Air sealing calculations
  async createAirSealingCalculation(calculation: InsertAirSealingCalculation): Promise<AirSealingCalculation> {
    // Convert numeric values to strings for database storage
    const dbValues = {
      ...calculation,
      airChanges: calculation.airChanges.toString(),
      floorArea: calculation.floorArea.toString(),
      ceilingHeight: calculation.ceilingHeight.toString(),
      thermostatSetPoint: calculation.thermostatSetPoint.toString(),
      outsideTemperature: calculation.outsideTemperature.toString(),
      temperatureDifference: calculation.temperatureDifference.toString(),
      heatingSystemEfficiency: calculation.heatingSystemEfficiency.toString(),
      conversionBtuToTherms: calculation.conversionBtuToTherms.toString(),
      annualHoursBelowSetpoint: calculation.annualHoursBelowSetpoint.toString(),
      savingsFraction: calculation.savingsFraction.toString(),
      conversionThermsToGj: calculation.conversionThermsToGj.toString(),
    };
    
    const [result] = await db
      .insert(airSealingCalculations)
      .values(dbValues)
      .returning();
    return result;
  }

  async getAirSealingCalculations(): Promise<AirSealingCalculation[]> {
    return await db
      .select()
      .from(airSealingCalculations)
      .orderBy(desc(airSealingCalculations.createdAt));
  }

  async getAirSealingCalculation(id: number): Promise<AirSealingCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(airSealingCalculations)
      .where(eq(airSealingCalculations.id, id));
    return calculation || undefined;
  }

  async updateAirSealingCalculation(id: number, calculation: Partial<InsertAirSealingCalculation>): Promise<AirSealingCalculation | undefined> {
    // Convert numeric values to strings for database storage
    const dbValues: any = { ...calculation };
    if (calculation.airChanges !== undefined) dbValues.airChanges = calculation.airChanges.toString();
    if (calculation.floorArea !== undefined) dbValues.floorArea = calculation.floorArea.toString();
    if (calculation.ceilingHeight !== undefined) dbValues.ceilingHeight = calculation.ceilingHeight.toString();
    if (calculation.thermostatSetPoint !== undefined) dbValues.thermostatSetPoint = calculation.thermostatSetPoint.toString();
    if (calculation.outsideTemperature !== undefined) dbValues.outsideTemperature = calculation.outsideTemperature.toString();
    if (calculation.temperatureDifference !== undefined) dbValues.temperatureDifference = calculation.temperatureDifference.toString();
    if (calculation.heatingSystemEfficiency !== undefined) dbValues.heatingSystemEfficiency = calculation.heatingSystemEfficiency.toString();
    if (calculation.conversionBtuToTherms !== undefined) dbValues.conversionBtuToTherms = calculation.conversionBtuToTherms.toString();
    if (calculation.annualHoursBelowSetpoint !== undefined) dbValues.annualHoursBelowSetpoint = calculation.annualHoursBelowSetpoint.toString();
    if (calculation.savingsFraction !== undefined) dbValues.savingsFraction = calculation.savingsFraction.toString();
    if (calculation.conversionThermsToGj !== undefined) dbValues.conversionThermsToGj = calculation.conversionThermsToGj.toString();

    const [updated] = await db
      .update(airSealingCalculations)
      .set(dbValues)
      .where(eq(airSealingCalculations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAirSealingCalculation(id: number): Promise<boolean> {
    const result = await db
      .delete(airSealingCalculations)
      .where(eq(airSealingCalculations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Attic insulation calculations
  async createAtticInsulationCalculation(calculation: InsertAtticInsulationCalculation): Promise<AtticInsulationCalculation> {
    // Convert numeric values to strings for database storage
    const dbValues = {
      ...calculation,
      percentageAirConditioning: calculation.percentageAirConditioning.toString(),
      rNew: calculation.rNew.toString(),
      rOld: calculation.rOld.toString(),
      areaInsulatedAttic: calculation.areaInsulatedAttic.toString(),
      atticFramingFactor: calculation.atticFramingFactor.toString(),
      hoursPerDay: calculation.hoursPerDay.toString(),
      cdd: calculation.cdd.toString(),
      hdd: calculation.hdd.toString(),
      discretionaryUseAdjustment: calculation.discretionaryUseAdjustment.toString(),
      efficiencyAirConditioning: calculation.efficiencyAirConditioning.toString(),
      efficiencyHeatingSystem: calculation.efficiencyHeatingSystem.toString(),
      btuToKbtu: calculation.btuToKbtu.toString(),
      btuToTherm: calculation.btuToTherm.toString(),
      adjustmentCoolingSavings: calculation.adjustmentCoolingSavings.toString(),
      adjustmentGasHeatingSavings: calculation.adjustmentGasHeatingSavings.toString(),
      kwhToGj: calculation.kwhToGj.toString(),
      thermToGj: calculation.thermToGj.toString(),
    };

    const [result] = await db
      .insert(atticInsulationCalculations)
      .values(dbValues)
      .returning();
    return result;
  }

  async getAtticInsulationCalculations(): Promise<AtticInsulationCalculation[]> {
    return await db
      .select()
      .from(atticInsulationCalculations)
      .orderBy(desc(atticInsulationCalculations.createdAt));
  }

  async getAtticInsulationCalculation(id: number): Promise<AtticInsulationCalculation | undefined> {
    const [calculation] = await db
      .select()
      .from(atticInsulationCalculations)
      .where(eq(atticInsulationCalculations.id, id));
    return calculation || undefined;
  }

  async updateAtticInsulationCalculation(id: number, calculation: Partial<InsertAtticInsulationCalculation>): Promise<AtticInsulationCalculation | undefined> {
    // Convert numeric values to strings for database storage
    const dbValues: any = { ...calculation };
    if (calculation.percentageAirConditioning !== undefined) dbValues.percentageAirConditioning = calculation.percentageAirConditioning.toString();
    if (calculation.rNew !== undefined) dbValues.rNew = calculation.rNew.toString();
    if (calculation.rOld !== undefined) dbValues.rOld = calculation.rOld.toString();
    if (calculation.areaInsulatedAttic !== undefined) dbValues.areaInsulatedAttic = calculation.areaInsulatedAttic.toString();
    if (calculation.atticFramingFactor !== undefined) dbValues.atticFramingFactor = calculation.atticFramingFactor.toString();
    if (calculation.hoursPerDay !== undefined) dbValues.hoursPerDay = calculation.hoursPerDay.toString();
    if (calculation.cdd !== undefined) dbValues.cdd = calculation.cdd.toString();
    if (calculation.hdd !== undefined) dbValues.hdd = calculation.hdd.toString();
    if (calculation.discretionaryUseAdjustment !== undefined) dbValues.discretionaryUseAdjustment = calculation.discretionaryUseAdjustment.toString();
    if (calculation.efficiencyAirConditioning !== undefined) dbValues.efficiencyAirConditioning = calculation.efficiencyAirConditioning.toString();
    if (calculation.efficiencyHeatingSystem !== undefined) dbValues.efficiencyHeatingSystem = calculation.efficiencyHeatingSystem.toString();
    if (calculation.btuToKbtu !== undefined) dbValues.btuToKbtu = calculation.btuToKbtu.toString();
    if (calculation.btuToTherm !== undefined) dbValues.btuToTherm = calculation.btuToTherm.toString();
    if (calculation.adjustmentCoolingSavings !== undefined) dbValues.adjustmentCoolingSavings = calculation.adjustmentCoolingSavings.toString();
    if (calculation.adjustmentGasHeatingSavings !== undefined) dbValues.adjustmentGasHeatingSavings = calculation.adjustmentGasHeatingSavings.toString();
    if (calculation.kwhToGj !== undefined) dbValues.kwhToGj = calculation.kwhToGj.toString();
    if (calculation.thermToGj !== undefined) dbValues.thermToGj = calculation.thermToGj.toString();

    const [result] = await db
      .update(atticInsulationCalculations)
      .set(dbValues)
      .where(eq(atticInsulationCalculations.id, id))
      .returning();
    return result || undefined;
  }

  async deleteAtticInsulationCalculation(id: number): Promise<boolean> {
    const result = await db.delete(atticInsulationCalculations).where(eq(atticInsulationCalculations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Project methods
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db
      .insert(projects)
      .values(project)
      .returning();
    return result;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.lastModified));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const updateData = {
      ...project,
      lastModified: new Date(),
    };
    
    const [result] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    return result || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Audio recording methods
  async createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording> {
    const [result] = await db
      .insert(audioRecordings)
      .values(recording)
      .returning();
    return result;
  }

  async getAudioRecordings(projectId: number): Promise<AudioRecording[]> {
    return await db
      .select()
      .from(audioRecordings)
      .where(eq(audioRecordings.projectId, projectId))
      .orderBy(desc(audioRecordings.createdAt));
  }

  async getAudioRecording(id: number): Promise<AudioRecording | undefined> {
    const [result] = await db
      .select()
      .from(audioRecordings)
      .where(eq(audioRecordings.id, id));
    return result || undefined;
  }

  async updateAudioRecording(id: number, recording: Partial<InsertAudioRecording>): Promise<AudioRecording | undefined> {
    const [updated] = await db
      .update(audioRecordings)
      .set({
        ...recording,
        updatedAt: new Date()
      })
      .where(eq(audioRecordings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAudioRecording(id: number): Promise<boolean> {
    const result = await db
      .delete(audioRecordings)
      .where(eq(audioRecordings.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
