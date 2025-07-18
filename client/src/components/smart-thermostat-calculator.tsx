import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Thermometer, TrendingUp, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect } from "react";

// Smart Thermostat calculation input schema
const smartThermostatInputSchema = z.object({
  annualNaturalGasUse: z.number().min(0),
  savingsFactor: z.number().min(0).max(1),
});

type SmartThermostatCalculationInputs = z.infer<typeof smartThermostatInputSchema>;

interface SmartThermostatCalculationResults {
  annualSpaceHeatingEnergy: number;
  annualEnergySavingsGas: number;
}

export default function SmartThermostatCalculator() {
  const { toast } = useToast();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    const projectId = localStorage.getItem("currentProjectId");
    setCurrentProjectId(projectId);
  }, []);

  // Fetch current project to load saved data
  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<SmartThermostatCalculationInputs>({
    resolver: zodResolver(smartThermostatInputSchema),
    defaultValues: {
      annualNaturalGasUse: 141.35, // Common Values C13
      savingsFactor: 0.062,
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.smartThermostatData) {
      const data = project.smartThermostatData as any;
      form.reset({
        annualNaturalGasUse: parseFloat(data.annualNaturalGasUse) || 141.35,
        savingsFactor: parseFloat(data.savingsFactor) || 0.062,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        smartThermostatData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Smart Thermostat calculation saved to project successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save calculation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();

  // Calculate results in real-time
  const calculateResults = (inputs: SmartThermostatCalculationInputs): SmartThermostatCalculationResults => {
    // Annual Space Heating Energy = Annual Natural Gas Use × 0.737
    const annualSpaceHeatingEnergy = inputs.annualNaturalGasUse * 0.737;
    
    // Annual Energy Savings = Annual Space Heating Energy × Savings Factor
    const annualEnergySavingsGas = annualSpaceHeatingEnergy * inputs.savingsFactor;

    return {
      annualSpaceHeatingEnergy,
      annualEnergySavingsGas,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      annualSpaceHeatingEnergy: results.annualSpaceHeatingEnergy,
      annualEnergySavingsGas: results.annualEnergySavingsGas,
    };
    saveToProject.mutate(calculationData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="text-emerald-600" />
                  <span>Smart Thermostat Calculator</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Installing Smart Thermostat where previous thermostat was non-programmable
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    {/* Summary Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="bg-emerald-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Measure Name:</strong> Smart Thermostat</div>
                        <div><strong>Category:</strong> Space Heating</div>
                        <div><strong>Lifetime:</strong> 8 years</div>
                        <div><strong>Source:</strong> Illinois Statewide Technical Reference Manual, Version 10 (2022) — 5.3.11 Programmable Thermostats</div>
                      </div>
                    </div>

                    {/* Measure Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Measure Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Base Case:</strong> Non-Programmable Thermostat Installed with natural gas space heating</div>
                        <div><strong>Efficient Case:</strong> Smart Thermostat Installed with natural gas space heating (no electric cooling savings)</div>
                        <div><strong>Source:</strong> Home Energy Services – Impact Evaluation, August 2018</div>
                        <div><strong>Formula:</strong> Annual Space Heating Energy × Savings Factor</div>
                      </div>
                    </div>

                    {/* Calculation Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Values</h3>
                      
                      {/* Gas Usage Data */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Gas Usage Data</h4>
                        <FormField
                          control={form.control}
                          name="annualNaturalGasUse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Natural Gas Use (GJ)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Common Values C13</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Calculated Values (Locked) */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Calculated Values (Locked)</h4>
                        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                          <FormLabel className="text-sm font-medium text-orange-900">Annual Space Heating Energy (GJ)</FormLabel>
                          <p className="text-lg font-bold text-orange-600 mt-1">{results.annualSpaceHeatingEnergy.toFixed(3)}</p>
                          <p className="text-xs text-gray-500">Annual Natural Gas Use × 0.737 (assuming 73.7% of gas used for heating - NRCan)</p>
                        </div>
                      </div>

                      {/* Savings Factor */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Savings Factor</h4>
                        <FormField
                          control={form.control}
                          name="savingsFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Savings Factor (decimal)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Illinois Statewide TRM, Version 10 (2022), 5.3.11</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-6">
                      <Button 
                        onClick={handleSaveToProject}
                        disabled={saveToProject.isPending}
                        className="w-full"
                        size="lg"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        {saveToProject.isPending ? "Saving..." : "Save to Project"}
                      </Button>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <TrendingUp className="text-emerald-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Outputs</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-900">Annual Energy Savings - Gas</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{results.annualEnergySavingsGas.toFixed(6)} GJ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}