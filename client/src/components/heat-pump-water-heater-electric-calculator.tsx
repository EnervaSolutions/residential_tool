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

// Heat Pump Water Heater Electric calculation input schema
const heatPumpWaterHeaterElectricInputSchema = z.object({
  gallonsPerDay: z.number().min(0),
  densityOfWater: z.number().min(0),
  specificHeatOfWater: z.number().min(0),
  waterTempIntoTank: z.number().min(0),
  waterTempExitFromTank: z.number().min(0),
  energyFactorHeatPump: z.number().min(0),
  energyFactorElectricWaterHeater: z.number().min(0).max(1),
  conversionKbtuToGj: z.number().min(0),
});

type HeatPumpWaterHeaterElectricCalculationInputs = z.infer<typeof heatPumpWaterHeaterElectricInputSchema>;

interface HeatPumpWaterHeaterElectricCalculationResults {
  waterTempRise: number;
  kbtuReq: number;
  annualEnergySavings: number;
}

export default function HeatPumpWaterHeaterElectricCalculator() {
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

  const form = useForm<HeatPumpWaterHeaterElectricCalculationInputs>({
    resolver: zodResolver(heatPumpWaterHeaterElectricInputSchema),
    defaultValues: {
      gallonsPerDay: 19.81,
      densityOfWater: 8.33,
      specificHeatOfWater: 1,
      waterTempIntoTank: 46.04,
      waterTempExitFromTank: 140,
      energyFactorHeatPump: 2.0,
      energyFactorElectricWaterHeater: 0.9,
      conversionKbtuToGj: 0.001055056,
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.heatPumpWaterHeaterElectricData) {
      const data = project.heatPumpWaterHeaterElectricData as any;
      form.reset({
        gallonsPerDay: parseFloat(data.gallonsPerDay) || 19.81,
        densityOfWater: parseFloat(data.densityOfWater) || 8.33,
        specificHeatOfWater: parseFloat(data.specificHeatOfWater) || 1,
        waterTempIntoTank: parseFloat(data.waterTempIntoTank) || 46.04,
        waterTempExitFromTank: parseFloat(data.waterTempExitFromTank) || 140,
        energyFactorHeatPump: parseFloat(data.energyFactorHeatPump) || 2.0,
        energyFactorElectricWaterHeater: parseFloat(data.energyFactorElectricWaterHeater) || 0.9,
        conversionKbtuToGj: parseFloat(data.conversionKbtuToGj) || 0.001055056,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        heatPumpWaterHeaterElectricData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Heat Pump Water Heater Electric calculation saved to project successfully.",
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
  const calculateResults = (inputs: HeatPumpWaterHeaterElectricCalculationInputs): HeatPumpWaterHeaterElectricCalculationResults => {
    // Water Temperature Rise = Exit Temp - Inlet Temp
    const waterTempRise = inputs.waterTempExitFromTank - inputs.waterTempIntoTank;
    
    // kBTU_req = GPD × Density × SH × TempRise × 365 / 1000
    const kbtuReq = (inputs.gallonsPerDay * inputs.densityOfWater * inputs.specificHeatOfWater * waterTempRise * 365) / 1000;
    
    // Annual Energy Savings = (kBTU_req / 3.413) × ((1 / EFbase) - (1 / EFee)) × ConversionFactorFromkWhToGJ
    const annualEnergySavings = 
      (kbtuReq / 3.413) * 
      ((1 / inputs.energyFactorElectricWaterHeater) - (1 / inputs.energyFactorHeatPump)) * 
      inputs.conversionKbtuToGj;

    return {
      waterTempRise,
      kbtuReq,
      annualEnergySavings,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      waterTempRise: results.waterTempRise,
      kbtuReq: results.kbtuReq,
      annualEnergySavings: results.annualEnergySavings,
    };
    saveToProject.mutate(calculationData);
  };

  return (
    <>
      <div className="p-8">
        {/* Technology Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Zap className="text-emerald-600 text-3xl" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Heat Pump Water Heater - Electric Calculator</h1>
                <p className="text-lg text-gray-600">Energy Efficiency Retrofit Calculator</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CommonValuesDialog 
                values={getCommonValues('heat-pump-water-heater-electric')} 
                title="Common Values for Heat Pump Water Heater Electric Calculations"
              />
              <Button onClick={handleSaveToProject} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2" disabled={saveToProject.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveToProject.isPending ? "Saving..." : "Save to Project"}
              </Button>
            </div>
          </div>
        </div>

    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="text-indigo-600" />
                  <span>Heat Pump Water Heater - Electric Calculator</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Heat Pump Water Heater replacing Electric Water Heater
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    {/* Summary Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="bg-indigo-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Measure Name:</strong> Heat Pump Water Heater</div>
                        <div><strong>Category:</strong> Water Heater</div>
                        <div><strong>Lifetime:</strong> 15 years</div>
                        <div><strong>Source:</strong> Illinois Statewide Technical Reference Manual — 5.4.3 Heat Pump Water Heaters</div>
                      </div>
                    </div>

                    {/* Measure Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Measure Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Base Case:</strong> Electric water heater</div>
                        <div><strong>Efficient Case:</strong> Heat Pump Water Heater with EF of 2.0</div>
                        <div><strong>Source:</strong> MID-ATLANTIC TECHNICAL REFERENCE MANUAL VERSION 8 / May 2018 - Page 192</div>
                      </div>
                    </div>

                    {/* Calculation Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Values</h3>
                      
                      {/* Water Usage Properties */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Water Usage and Properties</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="gallonsPerDay"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gallons Used per Day (GPD)</FormLabel>
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

                          <FormField
                            control={form.control}
                            name="densityOfWater"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Density of Water (lb/gallon)</FormLabel>
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
                            name="specificHeatOfWater"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specific Heat of Water (BTU/lb·°F)</FormLabel>
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

                      {/* Water Temperatures */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Water Temperatures</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="waterTempIntoTank"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Water Temperature into Tank (°F)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Edmonton Water Report</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="waterTempExitFromTank"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Water Temperature Exit from Tank (°F)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: National Plumbing Code</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Calculated Values (Locked) */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Calculated Values (Locked)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <FormLabel className="text-sm font-medium text-blue-900">Water Temperature Rise (°F)</FormLabel>
                            <p className="text-lg font-bold text-blue-600 mt-1">{results.waterTempRise.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">ExitTemp - InletTemp</p>
                          </div>
                          
                          <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                            <FormLabel className="text-sm font-medium text-orange-900">Required Annual Heating Output (kBTU/year)</FormLabel>
                            <p className="text-lg font-bold text-orange-600 mt-1">{results.kbtuReq.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">(GPD × Density × SH × TempRise × 365) / 1000</p>
                          </div>
                        </div>
                      </div>

                      {/* Energy Factors */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Energy Factors</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="energyFactorHeatPump"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Energy Factor of Heat Pump (EFee)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Mid Atlantic TRM</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="energyFactorElectricWaterHeater"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Energy Factor of Electric Water Heater (EFbase)</FormLabel>
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

                      {/* Conversion Factor */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Conversion Factor</h4>
                        <FormField
                          control={form.control}
                          name="conversionKbtuToGj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conversion Factor from kBtu to GJ</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.0001" 
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
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <TrendingUp className="text-indigo-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Outputs</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-900">Annual Energy Savings</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{results.annualEnergySavings.toFixed(6)} GJ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</>
  );
}