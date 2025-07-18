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

// Heat Pump Water Heater calculation input schema
const heatPumpWaterHeaterInputSchema = z.object({
  gallonsPerDay: z.number().min(0),
  densityOfWater: z.number().min(0),
  specificHeatOfWater: z.number().min(0),
  waterTempIntoTank: z.number().min(0),
  waterTempExitFromTank: z.number().min(0),
  energyFactorHeatPump: z.number().min(0),
  energyFactorGasWaterHeater: z.number().min(0).max(1),
  conversionKwhToGj: z.number().min(0),
});

type HeatPumpWaterHeaterCalculationInputs = z.infer<typeof heatPumpWaterHeaterInputSchema>;

interface HeatPumpWaterHeaterCalculationResults {
  waterTempRise: number;
  kbtuReq: number;
  annualEnergySavings: number;
}

export default function HeatPumpWaterHeaterCalculator() {
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

  const form = useForm<HeatPumpWaterHeaterCalculationInputs>({
    resolver: zodResolver(heatPumpWaterHeaterInputSchema),
    defaultValues: {
      gallonsPerDay: 19.81,
      densityOfWater: 8.33,
      specificHeatOfWater: 1,
      waterTempIntoTank: 46.04,
      waterTempExitFromTank: 140,
      energyFactorHeatPump: 2.0,
      energyFactorGasWaterHeater: 0.8,
      conversionKwhToGj: 0.0036,
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.heatPumpWaterHeaterData) {
      const data = project.heatPumpWaterHeaterData as any;
      form.reset({
        gallonsPerDay: parseFloat(data.gallonsPerDay) || 19.81,
        densityOfWater: parseFloat(data.densityOfWater) || 8.33,
        specificHeatOfWater: parseFloat(data.specificHeatOfWater) || 1,
        waterTempIntoTank: parseFloat(data.waterTempIntoTank) || 46.04,
        waterTempExitFromTank: parseFloat(data.waterTempExitFromTank) || 140,
        energyFactorHeatPump: parseFloat(data.energyFactorHeatPump) || 2.0,
        energyFactorGasWaterHeater: parseFloat(data.energyFactorGasWaterHeater) || 0.8,
        conversionKwhToGj: parseFloat(data.conversionKwhToGj) || 0.0036,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        heatPumpWaterHeaterData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Heat Pump Water Heater calculation saved to project successfully.",
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
  const calculateResults = (inputs: HeatPumpWaterHeaterCalculationInputs): HeatPumpWaterHeaterCalculationResults => {
    // Water Temperature Rise = Exit Temp - Inlet Temp
    const waterTempRise = inputs.waterTempExitFromTank - inputs.waterTempIntoTank;
    
    // kBTU_req = GPD × Density × SH × TempRise × 365 / 1000
    const kbtuReq = (inputs.gallonsPerDay * inputs.densityOfWater * inputs.specificHeatOfWater * waterTempRise * 365) / 1000;
    
    // Annual Energy Savings = (kBTU_req / 3.413) × ((1 / EFbase) - (1 / EFee)) × ConversionFactorFromkWhToGJ
    const annualEnergySavings = 
      (kbtuReq / 3.413) * 
      ((1 / inputs.energyFactorGasWaterHeater) - (1 / inputs.energyFactorHeatPump)) * 
      inputs.conversionKwhToGj;

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
    <div className="p-8">
      {/* Technology Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Wind className="text-primary text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Heat Pump Water Heater - Gas Technology</h1>
              <p className="text-sm text-gray-600">Energy Efficiency Retrofit Calculator</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleSaveToProject} className="bg-primary hover:bg-blue-700" disabled={saveToProject.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveToProject.isPending ? "Saving..." : "Save to Project"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Measure Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
                  <TrendingUp className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Measure Overview</h2>
              </div>
              {/* Summary Section */}
              <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm">
                <div><strong>Measure Name:</strong> Heat Pump Water Heater</div>
                <div><strong>Category:</strong> Water Heater</div>
                <div><strong>Lifetime:</strong> 15 years</div>
                <div><strong>Source:</strong> Illinois Statewide Technical Reference Manual — 5.4.3 Heat Pump Water Heaters</div>
              </div>
              
              {/* Description */}
              <div className="space-y-3">
                <p className="text-gray-700"><strong>Base Case:</strong> Natural Gas water heater</p>
                <p className="text-gray-700"><strong>Efficient Case:</strong> Heat Pump Water Heater with EF of 2.0</p>
                <p className="text-gray-700"><strong>Source:</strong> MID-ATLANTIC TECHNICAL REFERENCE MANUAL VERSION 8 / May 2018 - Page 192</p>
              </div>
            </CardContent>
          </Card>

          {/* Input Parameters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
                  <Wind className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Input Parameters</h2>
              </div>
              
              <Form {...form}>
                <div className="space-y-8">

                    {/* Water Usage and Properties */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Usage and Properties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Temperatures</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <p className="text-xs text-gray-500">Source: National Plumbing Code 2015</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Energy Factors */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Factors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          name="energyFactorGasWaterHeater"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Energy Factor of Gas Water Heater (EFbase)</FormLabel>
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

                    {/* Calculated Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculated Values</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <FormLabel className="text-sm font-medium text-blue-900">Water Temperature Rise (°F)</FormLabel>
                          <p className="text-lg font-bold text-blue-600 mt-1">{results.waterTempRise.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Exit Temp - Inlet Temp</p>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <FormLabel className="text-sm font-medium text-orange-900">Required Annual Heating Output (kBTU/year)</FormLabel>
                          <p className="text-lg font-bold text-orange-600 mt-1">{results.kbtuReq.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">GPD × Density × SH × TempRise × 365 / 1000</p>
                        </div>
                      </div>
                    </div>

                    {/* Conversion Factor */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Factor</h3>
                      <FormField
                        control={form.control}
                        name="conversionKwhToGj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conversion Factor from kWh to GJ</FormLabel>
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
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp className="text-purple-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Calculation Results</h3>
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
  );
}