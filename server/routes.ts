import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWindowCalculationSchema, insertDoorCalculationSchema, insertAirSealingCalculationSchema, insertAtticInsulationCalculationSchema, insertProjectSchema, insertAudioRecordingSchema } from "@shared/schema";
import { z } from "zod";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, Media, VerticalAlign, ImageRun, ShadingType } from "docx";
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Get all window calculations
  app.get("/api/calculations", async (req, res) => {
    try {
      const calculations = await storage.getWindowCalculations();
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching calculations:", error);
      res.status(500).json({ message: "Failed to fetch calculations" });
    }
  });

  // Get a specific calculation
  app.get("/api/calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const calculation = await storage.getWindowCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      console.error("Error fetching calculation:", error);
      res.status(500).json({ message: "Failed to fetch calculation" });
    }
  });

  // Create a new calculation
  app.post("/api/calculations", async (req, res) => {
    try {
      const validatedData = insertWindowCalculationSchema.parse(req.body);
      const calculation = await storage.createWindowCalculation(validatedData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error creating calculation:", error);
      res.status(500).json({ message: "Failed to create calculation" });
    }
  });

  // Update a calculation
  app.put("/api/calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const validatedData = insertWindowCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateWindowCalculation(id, validatedData);

      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating calculation:", error);
      res.status(500).json({ message: "Failed to update calculation" });
    }
  });

  // Delete a calculation
  app.delete("/api/calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const deleted = await storage.deleteWindowCalculation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Calculation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calculation:", error);
      res.status(500).json({ message: "Failed to delete calculation" });
    }
  });

  // Door calculations endpoints
  // Get all door calculations
  app.get("/api/door-calculations", async (req, res) => {
    try {
      const calculations = await storage.getDoorCalculations();
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching door calculations:", error);
      res.status(500).json({ message: "Failed to fetch door calculations" });
    }
  });

  // Get a specific door calculation
  app.get("/api/door-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const calculation = await storage.getDoorCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Door calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      console.error("Error fetching door calculation:", error);
      res.status(500).json({ message: "Failed to fetch door calculation" });
    }
  });

  // Create a new door calculation
  app.post("/api/door-calculations", async (req, res) => {
    try {
      const validatedData = insertDoorCalculationSchema.parse(req.body);
      const calculation = await storage.createDoorCalculation(validatedData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error creating door calculation:", error);
      res.status(500).json({ message: "Failed to create door calculation" });
    }
  });

  // Update a door calculation
  app.put("/api/door-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const validatedData = insertDoorCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateDoorCalculation(id, validatedData);

      if (!calculation) {
        return res.status(404).json({ message: "Door calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating door calculation:", error);
      res.status(500).json({ message: "Failed to update door calculation" });
    }
  });

  // Delete a door calculation
  app.delete("/api/door-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const deleted = await storage.deleteDoorCalculation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Door calculation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting door calculation:", error);
      res.status(500).json({ message: "Failed to delete door calculation" });
    }
  });

  // Air Sealing API routes
  // Get all air sealing calculations
  app.get("/api/air-sealing-calculations", async (req, res) => {
    try {
      const calculations = await storage.getAirSealingCalculations();
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching air sealing calculations:", error);
      res.status(500).json({ message: "Failed to fetch air sealing calculations" });
    }
  });

  // Get a specific air sealing calculation
  app.get("/api/air-sealing-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const calculation = await storage.getAirSealingCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Air sealing calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      console.error("Error fetching air sealing calculation:", error);
      res.status(500).json({ message: "Failed to fetch air sealing calculation" });
    }
  });

  // Create a new air sealing calculation
  app.post("/api/air-sealing-calculations", async (req, res) => {
    try {
      const validatedData = insertAirSealingCalculationSchema.parse(req.body);
      const calculation = await storage.createAirSealingCalculation(validatedData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error creating air sealing calculation:", error);
      res.status(500).json({ message: "Failed to create air sealing calculation" });
    }
  });

  // Update an air sealing calculation
  app.put("/api/air-sealing-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const validatedData = insertAirSealingCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateAirSealingCalculation(id, validatedData);

      if (!calculation) {
        return res.status(404).json({ message: "Air sealing calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating air sealing calculation:", error);
      res.status(500).json({ message: "Failed to update air sealing calculation" });
    }
  });

  // Delete an air sealing calculation
  app.delete("/api/air-sealing-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const deleted = await storage.deleteAirSealingCalculation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Air sealing calculation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting air sealing calculation:", error);
      res.status(500).json({ message: "Failed to delete air sealing calculation" });
    }
  });

  // Attic Insulation API routes
  // Get all attic insulation calculations
  app.get("/api/attic-insulation-calculations", async (req, res) => {
    try {
      const calculations = await storage.getAtticInsulationCalculations();
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching attic insulation calculations:", error);
      res.status(500).json({ message: "Failed to fetch attic insulation calculations" });
    }
  });

  // Get a specific attic insulation calculation
  app.get("/api/attic-insulation-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const calculation = await storage.getAtticInsulationCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Attic insulation calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      console.error("Error fetching attic insulation calculation:", error);
      res.status(500).json({ message: "Failed to fetch attic insulation calculation" });
    }
  });

  // Create a new attic insulation calculation
  app.post("/api/attic-insulation-calculations", async (req, res) => {
    try {
      const validatedData = insertAtticInsulationCalculationSchema.parse(req.body);
      const calculation = await storage.createAtticInsulationCalculation(validatedData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error creating attic insulation calculation:", error);
      res.status(500).json({ message: "Failed to create attic insulation calculation" });
    }
  });

  // Update an attic insulation calculation
  app.put("/api/attic-insulation-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const validatedData = insertAtticInsulationCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateAtticInsulationCalculation(id, validatedData);

      if (!calculation) {
        return res.status(404).json({ message: "Attic insulation calculation not found" });
      }

      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating attic insulation calculation:", error);
      res.status(500).json({ message: "Failed to update attic insulation calculation" });
    }
  });

  // Delete an attic insulation calculation
  app.delete("/api/attic-insulation-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid calculation ID" });
      }

      const deleted = await storage.deleteAtticInsulationCalculation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Attic insulation calculation not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attic insulation calculation:", error);
      res.status(500).json({ message: "Failed to delete attic insulation calculation" });
    }
  });

  // Project Management API routes
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get a specific project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update a project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Export project as Word document
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Generate Word document
      const buffer = await generateProjectReport(project);
      const filename = `EERP_Report_${project.clientFileNumber}_${new Date().toISOString().split('T')[0]}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // Audio recording routes
  // Get all audio recordings for a project
  app.get("/api/projects/:projectId/audio", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const recordings = await storage.getAudioRecordings(projectId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching audio recordings:", error);
      res.status(500).json({ message: "Failed to fetch audio recordings" });
    }
  });

  // Create an audio recording 
  app.post("/api/projects/:projectId/audio", upload.single('audio'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
  
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
  
      // Validate file size (direct buffer size, no base64 inflation)
      if (req.file.size > 50 * 1024 * 1024) { // 50MB limit
        return res.status(413).json({ message: "Audio file too large (max 50MB)" });
      }
  
      // Support both WebM/Opus and MP4/Opus
      const allowedMimeTypes = [
      'audio/webm', 
      'audio/mp4', 
      'audio/wav', 
      'audio/ogg'
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid audio format" });
      }

      const validatedData = insertAudioRecordingSchema.parse({
        name: req.body.name,
        description: req.body.description || undefined,
        duration: parseFloat(req.body.duration),
        mimeType: req.body.mimeType || req.file.mimetype,
        audioData: req.file.buffer.toString('base64'), // Convert to base64 only for storage
        projectId
      });
      
      const recording = await storage.createAudioRecording(validatedData);
      res.status(201).json(recording);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      
      if (error instanceof Error) {
        if (error.message.includes('too large')) {
          return res.status(413).json({ message: "Audio file too large" });
        }
        if (error.message.includes('timeout')) {
          return res.status(408).json({ message: "Request timeout - please try again" });
        }
      }
      
      console.error("Error creating audio recording:", error);
      res.status(500).json({ message: "Failed to create audio recording" });
    }
  });

  // Delete an audio recording
  app.delete("/api/audio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recording ID" });
      }

      const deleted = await storage.deleteAudioRecording(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recording not found" });
      }

      res.json({ message: "Recording deleted successfully" });
    } catch (error) {
      console.error("Error deleting audio recording:", error);
      res.status(500).json({ message: "Failed to delete audio recording" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Generate Word document for project report
async function generateProjectReport(project: any): Promise<Buffer> {
  const technologiesMap = {
    "ENERGY STAR® Replacement Window": "Replace a window in a pre-existing rough opening with an ENERGY STAR® certified window. The ENERGY STAR® window should have a U value of 1.22 W/m2K or lower.",
    "ENERGY STAR® Replacement Door": "Replace a door in a pre-existing rough opening with an ENERGY STAR® certified door. The ENERGY STAR® door should have a U value of 0.21 Btu/h∙ft2◦F or lower.",
    "Air Sealing": "Improve the air tightness of your home by 10%. Eligible activities include sealing, caulking, weatherproofing etc.",
    "Attic Insulation": "Increase the insulation level to at least R-55 for attic spaces, or R-28 for flat or cathedral ceilings for a minimum of 20% of the total ceiling area",
    "DWHR - Gas": "Install a new device which satisfies CSA B55.1 and CSA B55.2 and is listed within NRCan's Hot2000 residential energy modeling software with a minimum heat recovery rate of 25%.",
    "DWHR - Electric": "Install a new device which satisfies CSA B55.1 and CSA B55.2 and is listed within NRCan's Hot2000 residential energy modeling software with a minimum heat recovery rate of 25%.",
    "Heat Pump Water Heater - Gas": "Replace the primary domestic hot water heating appliance with an ENERGY STAR® certified electric heat pump appliance. The Energy Factor for the Heat Pump Water Heater should be a minimum of 2.0.",
    "Heat Pump Water Heater - Electric": "Replace the primary domestic hot water heating appliance with an ENERGY STAR® certified electric heat pump appliance. The Energy Factor for the Heat Pump Water Heater should be a minimum of 2.0.",
    "Heat Recovery Ventilator": "Install or replace HRV which is certified by the Home Ventilating Institute (HVI) and listed in Section 3 of their Certified Products Directory. The HRV must have a sensible recovery efficiency greater than 75%. If replacing an existing HRV, the efficiency of the new unit must be higher than the replaced unit.",
    "Smart Thermostat": "Install an ENERGY STAR® certified smart thermostat.",
    "Ground Source Heat Pump": "Install a ground source heat pump central heating system by a an IGSHPA certified installer, which satisfies CSA Standard C448, and where the heat pump itself is ENERGY STAR rated.",
    "DMSHP": "Install an ENERGY STAR mini-split ductless heat pump heating system, where the rated heat capacity is sufficient to satisfy at least 50% of the homes heating load. The new heat pump should have a minimum SEER of 15 and COP of 2.72/HSPF of 8.2.",
    "Solar PV": "Solar panels must be permanently mounted. They can be on the house or ground as long as they are on the property of the house associated with your application. All equipment must be new, owned by the program participant and purchased in Canada. The PV system equipment needs to have warranty. Total system peak power capacity must be equal to or greater than 1.0 kW DC."
  };

  const eligibleTechnologies: Array<{ name: string, spec: string, savings?: string }> = [];

  if (project.windowsData) {
    const gasSavings = project.windowsData.gasSavings || 0;
    const electricitySavings = project.windowsData.electricitySavings || 0;
    eligibleTechnologies.push({
      name: "ENERGY STAR® Replacement Window",
      spec: technologiesMap["ENERGY STAR® Replacement Window"],
      savings: `Gas Savings: ${gasSavings.toFixed(6)} GJ/year, Electricity Savings: ${electricitySavings.toFixed(6)} GJ/year`
    });
  }
  if (project.doorsData) {
    const gasSavings = project.doorsData.gasSavings || 0;
    const electricitySavings = project.doorsData.electricitySavings || 0;
    eligibleTechnologies.push({
      name: "ENERGY STAR® Replacement Door",
      spec: technologiesMap["ENERGY STAR® Replacement Door"],
      savings: `Gas Savings: ${gasSavings.toFixed(6)} GJ/year, Electricity Savings: ${electricitySavings.toFixed(6)} GJ/year`
    });
  }
  if (project.airSealingData) {
    const gasSavings = project.airSealingData.gasSavings || 0;
    eligibleTechnologies.push({
      name: "Air Sealing",
      spec: technologiesMap["Air Sealing"],
      savings: `Gas Savings: ${gasSavings.toFixed(6)} GJ/year`
    });
  }
  if (project.atticInsulationData) {
    const gasSavings = project.atticInsulationData.gasSavings || 0;
    const electricitySavings = project.atticInsulationData.electricitySavings || 0;
    eligibleTechnologies.push({
      name: "Attic Insulation",
      spec: technologiesMap["Attic Insulation"],
      savings: `Gas Savings: ${gasSavings.toFixed(6)} GJ/year, Electricity Savings: ${electricitySavings.toFixed(6)} GJ/year`
    });
  }
  if (project.dwhreData) {
    const annualEnergyRecovered = project.dwhreData.annualEnergyRecovered || 0;
    const annualFuelSaved = project.dwhreData.annualFuelSaved || 0;
    eligibleTechnologies.push({
      name: "DWHR - Gas",
      spec: technologiesMap["DWHR - Gas"],
      savings: `Annual Energy Recovered: ${annualEnergyRecovered.toFixed(6)} GJ/year, Annual Fuel Saved: ${annualFuelSaved.toFixed(6)} GJ/year`
    });
  }
  if (project.dwhreElectricData) {
    const annualEnergyRecovered = project.dwhreElectricData.annualEnergyRecovered || 0;
    const annualFuelSaved = project.dwhreElectricData.annualFuelSaved || 0;
    eligibleTechnologies.push({
      name: "DWHR - Electric",
      spec: technologiesMap["DWHR - Electric"],
      savings: `Annual Energy Recovered: ${annualEnergyRecovered.toFixed(6)} GJ/year, Annual Fuel Saved: ${annualFuelSaved.toFixed(6)} GJ/year`
    });
  }
  if (project.heatPumpWaterHeaterData) {
    const annualEnergySavings = project.heatPumpWaterHeaterData.annualEnergySavings || 0;
    eligibleTechnologies.push({
      name: "Heat Pump Water Heater - Gas",
      spec: technologiesMap["Heat Pump Water Heater - Gas"],
      savings: `Annual Energy Savings: ${annualEnergySavings.toFixed(6)} GJ/year`
    });
  }
  if (project.heatPumpWaterHeaterElectricData) {
    const annualEnergySavings = project.heatPumpWaterHeaterElectricData.annualEnergySavings || 0;
    eligibleTechnologies.push({
      name: "Heat Pump Water Heater - Electric",
      spec: technologiesMap["Heat Pump Water Heater - Electric"],
      savings: `Annual Energy Savings: ${annualEnergySavings.toFixed(6)} GJ/year`
    });
  }
  if (project.heatRecoveryVentilatorData) {
    const annualEnergySavingsGas = project.heatRecoveryVentilatorData.annualEnergySavingsGas || 0;
    eligibleTechnologies.push({
      name: "Heat Recovery Ventilator",
      spec: technologiesMap["Heat Recovery Ventilator"],
      savings: `Annual Energy Savings - Gas: ${annualEnergySavingsGas.toFixed(6)} GJ/year`
    });
  }
  if (project.smartThermostatData) {
    const annualEnergySavingsGas = project.smartThermostatData.annualEnergySavingsGas || 0;
    eligibleTechnologies.push({
      name: "Smart Thermostat",
      spec: technologiesMap["Smart Thermostat"],
      savings: `Annual Energy Savings - Gas: ${annualEnergySavingsGas.toFixed(6)} GJ/year`
    });
  }
  if (project.groundSourceHeatPumpData) {
    const annualEnergySavingsGas = project.groundSourceHeatPumpData.annualEnergySavingsGas || 0;
    const annualEnergySavingsElectricity = project.groundSourceHeatPumpData.annualEnergySavingsElectricity || 0;
    eligibleTechnologies.push({
      name: "Ground Source Heat Pump",
      spec: technologiesMap["Ground Source Heat Pump"],
      savings: `Annual Energy Savings - Gas: ${annualEnergySavingsGas.toFixed(6)} GJ/year, Annual Energy Savings - Electricity: ${annualEnergySavingsElectricity.toFixed(6)} GJ/year`
    });
  }
  if (project.dmshpData) {
    const annualEnergySavingsGas = project.dmshpData.annualEnergySavingsGas || 0;
    const annualEnergySavingsHeatingElectricity = project.dmshpData.annualEnergySavingsHeatingElectricity || 0;
    const annualEnergySavingsCoolingElectricity = project.dmshpData.annualEnergySavingsCoolingElectricity || 0;
    eligibleTechnologies.push({
      name: "DMSHP",
      spec: technologiesMap["DMSHP"],
      savings: `Annual Energy Savings - Gas: ${annualEnergySavingsGas.toFixed(6)} GJ/year, Heating Electricity Savings: ${annualEnergySavingsHeatingElectricity.toFixed(6)} GJ/year, Cooling Electricity Savings: ${annualEnergySavingsCoolingElectricity.toFixed(6)} GJ/year`
    });
  }
  if (project.solarPvData) {
    const annualEnergyProductionGj = project.solarPvData.annualEnergyProductionGj || 0;
    eligibleTechnologies.push({
      name: "Solar PV",
      spec: technologiesMap["Solar PV"],
      savings: `Annual Energy Production: ${annualEnergyProductionGj.toFixed(6)} GJ/kW`
    });
  }

  // Create technology table
  const technologyRows = eligibleTechnologies.map(tech =>
    new TableRow({
      children: [
        new TableCell({
          width: {
            size: 50,
            type: WidthType.PERCENTAGE,
          },
          margins: { top: 100, bottom: 100, left: 200, right: 200 },
          children: [new Paragraph({
            children: [new TextRun({ text: tech.name })]
          })]
        }),
        new TableCell({
          width: {
            size: 50,
            type: WidthType.PERCENTAGE,
          },
          margins: { top: 100, bottom: 100, left: 200, right: 200 },
          children: [new Paragraph({
            children: [new TextRun({ text: tech.spec })]
          })]
        }),
      ]
    })
  );

  const logoPath = path.join(process.cwd(), 'attached_assets', 'EnervaLogo.png');
  const logoBuffer = fs.readFileSync(logoPath);


  const doc = new Document({
    sections: [{
      children: [
        // Header
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          columnWidths: [2000, 4000, 3000], 
          rows: [
            new TableRow({
              children: [
                // Left cell - Logo
                new TableCell({
                  width: {
                    size: 40,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: logoBuffer,
                          transformation: {
                            width: 150,
                            height: 36,
                          },
                          type: "jpg",
                        }),
                      ]
                    })
                  ],
                }),
                // Middle cell - Empty spacer
                new TableCell({
                  width: {
                    size: 20,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    new Paragraph({ text: "" }) 
                  ],
                }),
                // Right cell - Project Information  
                new TableCell({
                  width: {
                    size: 40,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `Client File Number: ${project.clientFileNumber}`, bold: true })],
                      alignment: AlignmentType.RIGHT
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `Property Address: ${project.streetAddress}` })],
                      alignment: AlignmentType.RIGHT
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: `House Type: ${project.houseType}` })],
                      alignment: AlignmentType.RIGHT
                    }),
                    ...(project.userInfo ? [new Paragraph({
                      children: [new TextRun({ text: `Contact: ${project.userInfo}` })],
                      alignment: AlignmentType.RIGHT
                    })] : []),
                  ],
                })
              ]
            })
          ],
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          }
        }),

        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Energy Efficiency Retrofits Program",
              bold: true,
              size: 32
            })
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Pre-Retrofits EnerGuide Home Evaluation Results",
              bold: true,
              size: 24
            })
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),

        new Paragraph({ text: "" }),

        // Introduction
        new Paragraph({
          children: [
            new TextRun({
              text: "Thank you for completing your pre-retrofit EnerGuide home evaluation with Enerva Energy Solutions, Métis Capital Housing Corporation's preferred EnerGuide audit partner. We appreciate your participation in the Energy Efficiency Retrofits Program."
            })
          ]
        }),

        new Paragraph({ text: "" }),

        new Paragraph({ text: "" }),

        // Technologies section
        new Paragraph({
          children: [
            new TextRun({
              text: "Following your evaluation, the following technologies have been identified as suitable retrofits for your home:",
            })
          ]
        }),

        new Paragraph({ text: "" }),

        // Technology table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          columnWidths: [3000, 6000],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  margins: { top: 100, bottom: 100, left: 200, right: 200 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Technology Name", bold: true })]
                  })]
                }),
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  margins: { top: 100, bottom: 100, left: 200, right: 200 },
                  children: [new Paragraph({
                    children: [new TextRun({ text: "Technology Specification Required", bold: true })]
                  })]
                })
              ]
            }),
            ...technologyRows
          ]
        }),


        new Paragraph({ text: "" }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "Please proceed to Step 2 of your Energy Efficiency Retrofits Program Participant Checklist. In this step, you will select your preferred retrofits, obtain contractor quotes and submit them to the EERP program via email at eerp@metishousing.ca."
            })
          ]
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({
              text: "If you have any questions, please contact the Energy Efficiency Retrofits team at eerp@metishousing.ca."
            })
          ]
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Thank you for participating in the Energy Efficiency Retrofits Program!",
              bold: true
            })
          ]
        }),
        
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Enerva Energy Solutions Inc. | 407 9th Avenue SE, Calgary, AB, T2G 2K7"
            })
          ],
          alignment: AlignmentType.CENTER
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "EERPsupport@enerva.ca  | https://enerva.ca"
            })
          ],
          alignment: AlignmentType.CENTER
        }),


        new Paragraph({ text: "" }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Report Generated: ${new Date().toLocaleDateString()}`,
              italics: true
            })
          ]
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}
