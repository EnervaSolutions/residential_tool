import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Home, Wind, Zap, Droplets, FileText, Save, Download, Thermometer, Snowflake, Sun, Mic, Fan } from "lucide-react";
import { Project } from "@shared/schema";
import { useProjectSwitch } from "@/hooks/useProjectSwitch";
import { RecordingSavePrompt } from "@/components/recording-save-prompt";

// Helper function to get technology results data
const getTechnologyResults = (techName: string, project: any) => {
  switch (techName) {
    case "Window Replacement":
      return project.windowsData ? {
        primary: `${(project.windowsData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Gas Savings: ${(project.windowsData.gasSavings || 0).toFixed(6)} GJ/year`,
          `Electricity Savings: ${(project.windowsData.electricitySavings || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "Door Replacement":
      return project.doorsData ? {
        primary: `${(project.doorsData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Gas Savings: ${(project.doorsData.gasSavings || 0).toFixed(6)} GJ/year`,
          `Electricity Savings: ${(project.doorsData.electricitySavings || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "Air Sealing":
      return project.airSealingData ? {
        primary: `${(project.airSealingData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [`Gas Savings: ${(project.airSealingData.gasSavings || 0).toFixed(6)} GJ/year`]
      } : null;
    case "Attic Insulation":
      return project.atticInsulationData ? {
        primary: `${(project.atticInsulationData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Gas Savings: ${(project.atticInsulationData.gasSavings || 0).toFixed(6)} GJ/year`,
          `Electricity Savings: ${(project.atticInsulationData.electricitySavings || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "DWHR - Gas":
      return project.dwhreData ? {
        primary: `${(project.dwhreData.annualFuelSaved || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Annual Energy Recovered: ${(project.dwhreData.annualEnergyRecovered || 0).toFixed(6)} GJ/year`,
          `Annual Fuel Saved: ${(project.dwhreData.annualFuelSaved || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "DWHR - Electric":
      return project.dwhreElectricData ? {
        primary: `${(project.dwhreElectricData.annualFuelSaved || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Annual Energy Recovered: ${(project.dwhreElectricData.annualEnergyRecovered || 0).toFixed(6)} GJ/year`,
          `Annual Fuel Saved: ${(project.dwhreElectricData.annualFuelSaved || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "Heat Pump Water Heater - Gas":
      return project.heatPumpWaterHeaterData ? {
        primary: `${(project.heatPumpWaterHeaterData.annualEnergySavings || 0).toFixed(2)} GJ/year`,
        detailed: [`Annual Energy Savings: ${(project.heatPumpWaterHeaterData.annualEnergySavings || 0).toFixed(6)} GJ/year`]
      } : null;
    case "Heat Pump Water Heater - Electric":
      return project.heatPumpWaterHeaterElectricData ? {
        primary: `${(project.heatPumpWaterHeaterElectricData.annualEnergySavings || 0).toFixed(2)} GJ/year`,
        detailed: [`Annual Energy Savings: ${(project.heatPumpWaterHeaterElectricData.annualEnergySavings || 0).toFixed(6)} GJ/year`]
      } : null;
    case "Heat Recovery Ventilator":
      return project.heatRecoveryVentilatorData ? {
        primary: `${(project.heatRecoveryVentilatorData.annualEnergySavingsGas || 0).toFixed(2)} GJ/year`,
        detailed: [`Annual Energy Savings - Gas: ${(project.heatRecoveryVentilatorData.annualEnergySavingsGas || 0).toFixed(6)} GJ/year`]
      } : null;
    case "Smart Thermostat":
      return project.smartThermostatData ? {
        primary: `${(project.smartThermostatData.annualEnergySavingsGas || 0).toFixed(2)} GJ/year`,
        detailed: [`Annual Energy Savings - Gas: ${(project.smartThermostatData.annualEnergySavingsGas || 0).toFixed(6)} GJ/year`]
      } : null;
    case "Ground Source Heat Pump":
      return project.groundSourceHeatPumpData ? {
        primary: `${(project.groundSourceHeatPumpData.annualEnergySavingsGas || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Annual Energy Savings - Gas: ${(project.groundSourceHeatPumpData.annualEnergySavingsGas || 0).toFixed(6)} GJ/year`,
          `Annual Energy Savings - Electricity: ${(project.groundSourceHeatPumpData.annualEnergySavingsElectricity || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "DMSHP":
      return project.dmshpData ? {
        primary: `${(project.dmshpData.annualEnergySavingsGas || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Annual Energy Savings - Gas: ${(project.dmshpData.annualEnergySavingsGas || 0).toFixed(6)} GJ/year`,
          `Annual Energy Savings - Heating Electricity: ${(project.dmshpData.annualEnergySavingsHeatingElectricity || 0).toFixed(6)} GJ/year`,
          `Annual Energy Savings - Cooling Electricity: ${(project.dmshpData.annualEnergySavingsCoolingElectricity || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "Solar PV":
      return project.solarPvData ? {
        primary: `${(project.solarPvData.annualEnergyProductionGj || 0).toFixed(2)} GJ/kW`,
        detailed: [`Annual Energy Production: ${(project.solarPvData.annualEnergyProductionGj || 0).toFixed(6)} GJ/kW`]
      } : null;
    case "ASHP Replacing Furnace DSX":
      return project.ashpData ? {
        primary: `${(project.ashpData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Gas Savings: ${(project.ashpData.gasSavings || 0).toFixed(6)} GJ/year`,
          `Electricity Savings: ${(project.ashpData.electricitySavings || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    case "ASHP Replacing ASHP":
      return project.ashpReplacingAshpData ? {
        primary: `${(project.ashpReplacingAshpData.gasSavings || 0).toFixed(2)} GJ/year`,
        detailed: [
          `Gas Savings: ${(project.ashpReplacingAshpData.gasSavings || 0).toFixed(6)} GJ/year`,
          `Electricity Savings: ${(project.ashpReplacingAshpData.electricitySavings || 0).toFixed(6)} GJ/year`
        ]
      } : null;
    default:
      return null;
  }
};

export default function ProjectDashboard() {
  const [, setLocation] = useLocation();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  const projectSwitch = useProjectSwitch({
    onSwitch: () => setLocation("/"),
    onBlocked: (reason) => toast({
      title: "Cannot Leave Project",
      description: reason,
      variant: "destructive",
    })
  });

  useEffect(() => {
    const projectId = localStorage.getItem("currentProjectId");
    if (!projectId) {
      setLocation("/");
      return;
    }
    setCurrentProjectId(projectId);
  }, [setLocation]);

  // Fetch current project
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  // Save project data mutation
  const saveProject = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Project Saved",
        description: "Your project has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export project mutation
  const exportProject = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${currentProjectId}/export`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename="')[1]?.split('"')[0] || 
                      `EERP_Report_${new Date().toISOString().split('T')[0]}.docx`;
      
      return { blob, filename };
    },
    onSuccess: ({ blob, filename }) => {
      // Create and download Word document
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      
      toast({
        title: "Export Complete",
        description: "Your project report has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export project. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calculator className="text-primary text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const technologies = [
    {
      name: "Window Replacement",
      path: "/windows",
      icon: Calculator,
      description: "Calculate energy savings from window upgrades",
      hasData: !!project.windowsData,
      color: "blue",
    },
    {
      name: "Door Replacement", 
      path: "/doors",
      icon: Home,
      description: "Evaluate door efficiency improvements",
      hasData: !!project.doorsData,
      color: "green",
    },
    {
      name: "Air Sealing",
      path: "/air-sealing", 
      icon: Wind,
      description: "Assess air leakage reduction benefits",
      hasData: !!project.airSealingData,
      color: "purple",
    },
    {
      name: "Attic Insulation",
      path: "/attic-insulation",
      icon: Zap,
      description: "Calculate insulation upgrade savings", 
      hasData: !!project.atticInsulationData,
      color: "orange",
    },
    {
      name: "DWHR - Gas",
      path: "/dwhr-gas",
      icon: Droplets,
      description: "Drain Water Heat Recovery with Natural Gas", 
      hasData: !!project.dwhreData,
      color: "cyan",
    },
    {
      name: "DWHR - Electric",
      path: "/dwhr-electric",
      icon: Zap,
      description: "Drain Water Heat Recovery with Electric Water Heater", 
      hasData: !!project.dwhreElectricData,
      color: "yellow",
    },
    {
      name: "Heat Pump Water Heater - Gas",
      path: "/heat-pump-water-heater",
      icon: Wind,
      description: "Heat Pump Water Heater replacing Gas", 
      hasData: !!project.heatPumpWaterHeaterData,
      color: "purple",
    },
    {
      name: "Heat Pump Water Heater - Electric",
      path: "/heat-pump-water-heater-electric",
      icon: Zap,
      description: "Heat Pump Water Heater replacing Electric", 
      hasData: !!project.heatPumpWaterHeaterElectricData,
      color: "indigo",
    },
    {
      name: "Heat Recovery Ventilator",
      path: "/heat-recovery-ventilator",
      icon: Wind,
      description: "HRV with 75% recovery efficiency", 
      hasData: !!project.heatRecoveryVentilatorData,
      color: "cyan",
    },
    {
      name: "Smart Thermostat",
      path: "/smart-thermostat",
      icon: Thermometer,
      description: "Smart programmable thermostat for gas heating", 
      hasData: !!project.smartThermostatData,
      color: "emerald",
    },
    {
      name: "Ground Source Heat Pump",
      path: "/ground-source-heat-pump",
      icon: Zap,
      description: "GSHP for heating & cooling with natural gas backup", 
      hasData: !!project.groundSourceHeatPumpData,
      color: "purple",
    },
    {
      name: "DMSHP",
      path: "/dmshp",
      icon: Snowflake,
      description: "Ductless mini-split heat pump replacing furnace", 
      hasData: !!project.dmshpData,
      color: "indigo",
    },
    {
      name: "Solar PV",
      path: "/solar-pv",
      icon: Sun,
      description: "1 kW Solar PV system energy production", 
      hasData: !!project.solarPvData,
      color: "yellow",
    },
    {
      name: "ASHP Replacing Furnace DSX",
      path: "/ashp-replacing-furnace-dsx",
      icon: Thermometer,
      description: "Air source heat pump replacing natural gas furnace", 
      hasData: !!project.ashpData,
      color: "red",
    },
    {
      name: "ASHP Replacing ASHP",
      path: "/ashp-replacing-ashp",
      icon: Fan,
      description: "High performance ASHP replacing conventional ASHP", 
      hasData: !!project.ashpReplacingAshpData,
      color: "teal",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">File Number:</span>
                    <span className="ml-2 text-gray-900">{project.clientFileNumber}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">House Type:</span>
                    <span className="ml-2 text-gray-900">{project.houseType}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Address:</span>
                  <span className="ml-2 text-gray-900">{project.streetAddress}</span>
                </div>
                {project.userInfo && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Contact Info:</span>
                    <span className="ml-2 text-gray-900">{project.userInfo}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => projectSwitch.switchProject(0)}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>

        {/* Technology Calculators */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology Calculators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {technologies.map((tech) => {
              const IconComponent = tech.icon;
              return (
                <Card key={tech.path} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${tech.color}-100`}>
                          <IconComponent className={`text-${tech.color}-600 text-xl`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tech.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{tech.description}</p>
                        </div>
                      </div>
                      {tech.hasData && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Save className="w-3 h-3 mr-1" />
                          Saved
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tech.hasData && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Saved Results:</h5>
                        <div className="text-xs text-gray-600 space-y-1">
                          {getTechnologyResults(tech.name, project)?.detailed.map((result, index) => (
                            <div key={index}>{result}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link href={tech.path}>
                      <Button className="w-full">
                        <Calculator className="w-4 h-4 mr-2" />
                        {tech.hasData ? "Continue Calculation" : "Start Calculation"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Audio Recording Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Audio Recordings</h2>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-pink-100">
                    <Mic className="text-pink-600 text-xl" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Record Conversations</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Record and save conversations for this project</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/audio-recording">
                <Button className="w-full">
                  <Mic className="w-4 h-4 mr-2" />
                  Manage Audio Recordings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Project Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-3 gap-4 min-w-full">
                      <div className="font-medium text-sm text-gray-700 pb-2 border-b">Technology Name</div>
                      <div className="font-medium text-sm text-gray-700 pb-2 border-b text-center">Status</div>
                      <div className="font-medium text-sm text-gray-700 pb-2 border-b text-right">Results</div>
                      
                      {technologies.map((tech) => {
                        const results = getTechnologyResults(tech.name, project);
                        const resultLines = results?.detailed || [];
                        
                        return (
                          <>
                            <div key={`${tech.path}-name`} className="py-2 text-sm text-gray-900 border-b border-gray-100">
                              {tech.name}
                            </div>
                            <div key={`${tech.path}-status`} className="py-2 text-center border-b border-gray-100">
                              <Badge variant={tech.hasData ? "default" : "outline"} className="text-xs">
                                {tech.hasData ? "Complete" : "Pending"}
                              </Badge>
                            </div>
                            <div key={`${tech.path}-results`} className="py-2 text-right border-b border-gray-100">
                              {tech.hasData ? (
                                <div className="text-green-600 space-y-0.5">
                                  {resultLines.map((result, index) => (
                                    <div key={index} className="text-xs leading-tight">{result}</div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">No data</span>
                              )}
                            </div>
                          </>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                    <div>Last Modified: {new Date(project.lastModified).toLocaleDateString()}</div>
                    <div>Technologies Available: {technologies.length}</div>
                    <div>Technologies Completed: {technologies.filter(t => t.hasData).length}</div>
                    <div>Results Saved: {technologies.filter(t => t.hasData).length}/{technologies.length}</div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Complete all technology calculations to generate a comprehensive energy efficiency report
                </p>
                <Button 
                  size="lg"
                  onClick={() => exportProject.mutate()}
                  disabled={exportProject.isPending}
                  className="px-8"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportProject.isPending ? "Generating..." : "Generate Pre-Retrofit Report"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recording Save Prompt */}
      <RecordingSavePrompt
        isOpen={projectSwitch.isPrompting}
        onSave={projectSwitch.saveAndSwitch}
        onDiscard={projectSwitch.discardAndSwitch}
        onCancel={projectSwitch.cancelSwitch}
        isSaving={projectSwitch.isSaving}
        duration={projectSwitch.currentDuration}
        projectId={parseInt(currentProjectId || '1')}
      />
    </div>
  );
}