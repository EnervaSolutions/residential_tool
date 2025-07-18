import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Zap, TrendingUp, Save } from "lucide-react";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect } from "react";

// DWHR Electric calculation input schema
const dwhreElectricInputSchema = z.object({
  waterTempOut: z.number().min(0),
  waterTempIn: z.number().min(0),
  dailyHotWaterUse: z.number().min(0),
  specificWeightWater: z.number().min(0),
  specificHeatWater: z.number().min(0),
  practicalEffectivenessDwhr: z.number().min(0).max(1),
  recoveryEfficiencyDwhr: z.number().min(0).max(1),
  electricWaterHeaterEfficiency: z.number().min(0).max(1),
  conversionBtuToTherms: z.number().min(0),
  conversionThermsToGj: z.number().min(0),
});

type DwhreElectricCalculationInputs = z.infer<typeof dwhreElectricInputSchema>;

interface DwhreElectricCalculationResults {
  annualHotWaterUse: number;
  annualEnergyRecovered: number;
  annualFuelSaved: number;
}

export default function DwhrElectricCalculator() {
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

  const form = useForm<DwhreElectricCalculationInputs>({
    resolver: zodResolver(dwhreElectricInputSchema),
    defaultValues: {
      waterTempOut: 101,
      waterTempIn: 46.04,
      dailyHotWaterUse: 19.81,
      specificWeightWater: 8.33,
      specificHeatWater: 1,
      practicalEffectivenessDwhr: 0.25,
      recoveryEfficiencyDwhr: 0.78,
      electricWaterHeaterEfficiency: 0.95,
      conversionBtuToTherms: 0.00001,
      conversionThermsToGj: 0.105506,
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.dwhreElectricData) {
      const data = project.dwhreElectricData as any;
      form.reset({
        waterTempOut: parseFloat(data.waterTempOut) || 101,
        waterTempIn: parseFloat(data.waterTempIn) || 46.04,
        dailyHotWaterUse: parseFloat(data.dailyHotWaterUse) || 19.81,
        specificWeightWater: parseFloat(data.specificWeightWater) || 8.33,
        specificHeatWater: parseFloat(data.specificHeatWater) || 1,
        practicalEffectivenessDwhr: parseFloat(data.practicalEffectivenessDwhr) || 0.25,
        recoveryEfficiencyDwhr: parseFloat(data.recoveryEfficiencyDwhr) || 0.78,
        electricWaterHeaterEfficiency: parseFloat(data.electricWaterHeaterEfficiency) || 0.95,
        conversionBtuToTherms: parseFloat(data.conversionBtuToTherms) || 0.00001,
        conversionThermsToGj: parseFloat(data.conversionThermsToGj) || 0.105506,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        dwhreElectricData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "DWHR Electric calculation saved to project successfully.",
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
  const calculateResults = (inputs: DwhreElectricCalculationInputs): DwhreElectricCalculationResults => {
    // Annual Hot Water Use = Daily Use × 365.25
    const annualHotWaterUse = inputs.dailyHotWaterUse * 365.25;
    
    // Annual Energy Recovered = (Tout - Tin) × Annual Hot Water Use × Specific Weight × Specific Heat × Practical Effectiveness × Conversion BTU to Therms ÷ Recovery Efficiency × Conversion Therms to GJ
    const annualEnergyRecovered = 
      ((inputs.waterTempOut - inputs.waterTempIn) * 
       annualHotWaterUse * 
       inputs.specificWeightWater * 
       inputs.specificHeatWater * 
       inputs.practicalEffectivenessDwhr * 
       inputs.conversionBtuToTherms / 
       inputs.recoveryEfficiencyDwhr) * 
      inputs.conversionThermsToGj;
    
    // Annual Fuel Saved = Annual Energy Recovered ÷ Electric Water Heater Efficiency
    const annualFuelSaved = annualEnergyRecovered / inputs.electricWaterHeaterEfficiency;

    return {
      annualHotWaterUse,
      annualEnergyRecovered,
      annualFuelSaved,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      annualHotWaterUse: results.annualHotWaterUse,
      annualEnergyRecovered: results.annualEnergyRecovered,
      annualFuelSaved: results.annualFuelSaved,
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Zap className="text-yellow-600 text-3xl" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">DWHR - Electric Calculator</h1>
                      <p className="text-lg text-gray-600">Drain Water Heat Recovery with Electric Water Heater</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CommonValuesDialog 
                      values={getCommonValues('dwhr-electric')} 
                      title="Common Values for DWHR Electric Calculations"
                    />
                    <Button onClick={handleSaveToProject} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2" disabled={saveToProject.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {saveToProject.isPending ? "Saving..." : "Save to Project"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    {/* Summary Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="bg-yellow-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Measure Name:</strong> Drain Water Heat Recovery with an Electric Water Heater</div>
                        <div><strong>Category:</strong> Domestic Water Heating</div>
                        <div><strong>Lifetime:</strong> 30 years</div>
                      </div>
                    </div>

                    {/* Measure Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Measure Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Base Case:</strong> Standard water heater with drain water with incoming water temperature of 46.04°F and leaving water of 101°F</div>
                        <div><strong>Efficient Case:</strong> Drain water heat recovery system with recovery efficiency greater than 25%</div>
                      </div>
                    </div>

                    {/* Water Temperature Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Temperature Properties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="waterTempOut"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Water Temperature Out of DWHR (Tout) (°F)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Cadmus & Opinion Dynamics Study, 2013</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="waterTempIn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Water Temperature Into DWHR (Tin) (°F)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: 2008 Edmonton Water Report</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Hot Water Usage */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hot Water Usage</h3>
                      <FormField
                        control={form.control}
                        name="dailyHotWaterUse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Hot Water Use (gallons/day)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Source: NRCan</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Physical Constants */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Constants</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="specificWeightWater"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specific Weight Water (lbs/gallon)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
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
                          name="specificHeatWater"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specific Heat Water (Btu/lbm/°F)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
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

                    {/* DWHR Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">DWHR Properties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="practicalEffectivenessDwhr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Practical Effectiveness of DWHR</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Iowa TRM 2019</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recoveryEfficiencyDwhr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recovery Efficiency of DWHR</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Iowa TRM 2019</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="electricWaterHeaterEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Electric Water Heater Efficiency</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Values</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Conversion Factors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Factors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="conversionBtuToTherms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conversion Factor for BTU to Therms</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.00001" 
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
                          name="conversionThermsToGj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conversion Factor for Therms to GJ</FormLabel>
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
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <TrendingUp className="text-yellow-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Calculation Results</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="text-blue-600 w-5 h-5" />
                      <span className="text-sm font-medium text-blue-900">Annual Energy Recovered</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{results.annualEnergyRecovered.toFixed(6)} GJ</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-900">Annual Fuel Saved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{results.annualFuelSaved.toFixed(6)} GJ</p>
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