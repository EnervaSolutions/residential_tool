import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wind, TrendingUp, Save } from "lucide-react";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect } from "react";

// Heat Recovery Ventilator calculation input schema
const heatRecoveryVentilatorInputSchema = z.object({
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
});

type HeatRecoveryVentilatorCalculationInputs = z.infer<typeof heatRecoveryVentilatorInputSchema>;

interface HeatRecoveryVentilatorCalculationResults {
  annualEnergySavingsGas: number;
}

export default function HeatRecoveryVentilatorCalculator() {
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

  const form = useForm<HeatRecoveryVentilatorCalculationInputs>({
    resolver: zodResolver(heatRecoveryVentilatorInputSchema),
    defaultValues: {
      minimumExhaustFlowRate: 100,
      specificHeatCapacityAir: 1.005,
      densityAirRoomTemperature: 1.225,
      heatingDegreeDays: 5092,
      conversionFactorDaysToHours: 24,
      sensibleRecoveryEfficiencyUpgrade: 0.75,
      sensibleRecoveryEfficiencyBaseline: 0,
      heatingSystemEfficiency: 0.85,
      conversionLToM3: 0.001,
      conversionKjToGj: 0.000001,
      conversionHoursToSeconds: 3600,
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.heatRecoveryVentilatorData) {
      const data = project.heatRecoveryVentilatorData as any;
      form.reset({
        minimumExhaustFlowRate: parseFloat(data.minimumExhaustFlowRate) || 100,
        specificHeatCapacityAir: parseFloat(data.specificHeatCapacityAir) || 1.005,
        densityAirRoomTemperature: parseFloat(data.densityAirRoomTemperature) || 1.225,
        heatingDegreeDays: parseFloat(data.heatingDegreeDays) || 5092,
        conversionFactorDaysToHours: parseFloat(data.conversionFactorDaysToHours) || 24,
        sensibleRecoveryEfficiencyUpgrade: parseFloat(data.sensibleRecoveryEfficiencyUpgrade) || 0.75,
        sensibleRecoveryEfficiencyBaseline: parseFloat(data.sensibleRecoveryEfficiencyBaseline) || 0,
        heatingSystemEfficiency: parseFloat(data.heatingSystemEfficiency) || 0.85,
        conversionLToM3: parseFloat(data.conversionLToM3) || 0.001,
        conversionKjToGj: parseFloat(data.conversionKjToGj) || 0.000001,
        conversionHoursToSeconds: parseFloat(data.conversionHoursToSeconds) || 3600,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        heatRecoveryVentilatorData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Heat Recovery Ventilator calculation saved to project successfully.",
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
  const calculateResults = (inputs: HeatRecoveryVentilatorCalculationInputs): HeatRecoveryVentilatorCalculationResults => {
    // Annual Energy Savings = MinimumExhaustFlowRate * Conversion Factor for L to m3 * Specific Heat Capacity of Air @ 27C * Density of Air at Room Temperature * Heating Degree Days * Conversion Factor for Days to Hours * (Sensible Recovery Efficiency (Upgrade) - Sensible Recovery Efficiency (Baseline)) * Conversion Factor for Hours to Seconds / Efficiency of Heating System * Conversion Factor for kJ to GJ
    const annualEnergySavingsGas = 
      inputs.minimumExhaustFlowRate * 
      inputs.conversionLToM3 * 
      inputs.specificHeatCapacityAir * 
      inputs.densityAirRoomTemperature * 
      inputs.heatingDegreeDays * 
      inputs.conversionFactorDaysToHours * 
      (inputs.sensibleRecoveryEfficiencyUpgrade - inputs.sensibleRecoveryEfficiencyBaseline) * 
      inputs.conversionHoursToSeconds / 
      inputs.heatingSystemEfficiency * 
      inputs.conversionKjToGj;

    return {
      annualEnergySavingsGas,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
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
                  <Wind className="text-cyan-600" />
                  <span>Heat Recovery Ventilator Calculator</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Installing HRV that meets SRE requirements of 75% in a natural gas heated home
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    {/* Summary Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="bg-cyan-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Measure Name:</strong> Heat Recovery Ventilator</div>
                        <div><strong>Category:</strong> Space Heating</div>
                        <div><strong>Lifetime:</strong> 15 years</div>
                        <div><strong>Source:</strong> Iowa Energy Efficiency Statewide Technical Reference Manual — 2.4.8 Energy Recovery Ventilator</div>
                      </div>
                    </div>

                    {/* Measure Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Measure Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Base Case:</strong> No HRV with natural gas furnace</div>
                        <div><strong>Efficient Case:</strong> HRV with recovery efficiency of 75% with natural gas furnace</div>
                        <div><strong>Source:</strong> Iowa Energy Efficiency Statewide Technical Reference Manual — 2.4.8</div>
                        <div><strong>Formula:</strong> MinimumExhaustFlowRate × ConversionL_to_m3 × SpecificHeatCapacityAir × DensityAir × HDD × ConversionDays_to_Hours × (SRE_Upgrade - SRE_Baseline) × ConversionHours_to_Seconds ÷ HeatingSystemEfficiency × ConversionkJ_to_GJ</div>
                      </div>
                    </div>

                    {/* Calculation Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Values</h3>
                      
                      {/* Flow and Air Properties */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Flow and Air Properties</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="minimumExhaustFlowRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Exhaust Flow Rate (L/s)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: ASHRAE Standard 62.2</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="specificHeatCapacityAir"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specific Heat Capacity Air @ 27°C (kJ/kg·K)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: ASHRAE</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="densityAirRoomTemperature"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Density Air Room Temperature (kg/m³)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: ASHRAE</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Climate Data */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Climate Data</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="heatingDegreeDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Heating Degree Days (°C·days)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="conversionFactorDaysToHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conversion Factor Days to Hours</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Constant</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Efficiency Values */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Efficiency Values</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="sensibleRecoveryEfficiencyUpgrade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SRE Upgrade (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Program min value</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sensibleRecoveryEfficiencyBaseline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SRE Baseline (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Assume HRV not installed</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="heatingSystemEfficiency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Heating System Efficiency (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Conversion Factors */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Conversion Factors</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="conversionLToM3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conversion L to m³</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Constant</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="conversionKjToGj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conversion kJ to GJ</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.000001" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Constant</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="conversionHoursToSeconds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Conversion Hours to Seconds</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Constant</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-cyan-100 p-2 rounded-lg">
                    <TrendingUp className="text-cyan-600 text-xl" />
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