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

// Ground Source Heat Pump calculation input schema
const groundSourceHeatPumpInputSchema = z.object({
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
});

type GroundSourceHeatPumpCalculationInputs = z.infer<typeof groundSourceHeatPumpInputSchema>;

interface GroundSourceHeatPumpCalculationResults {
  annualEnergySavingsGas: number;
  annualEnergySavingsElectricity: number;
}

export default function GroundSourceHeatPumpCalculator() {
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

  const form = useForm<GroundSourceHeatPumpCalculationInputs>({
    resolver: zodResolver(groundSourceHeatPumpInputSchema),
    defaultValues: {
      eflhHeating: 1315.0, // Common Values C2
      eflhCooling: 400.0, // Common Values C3
      seerBase: 13.0, // Common Values C11
      eerEfficient: 22.43, // 2020 TRM
      factorSeerToEer: 1.02, // 2020 TRM
      kilowattConversionFactor: 1000.0, // Engineering constant
      btuHeat: 33200.0, // Common Values E14
      btuCool: 30000.0, // Common Values E15
      hspfBase: 7.7, // IECC 2009
      copEfficient: 4.18, // 2020 TRM
      conversionWattsToBtu: 3.412, // Engineering constant
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.groundSourceHeatPumpData) {
      const data = project.groundSourceHeatPumpData as any;
      form.reset({
        eflhHeating: parseFloat(data.eflhHeating) || 1315.0,
        eflhCooling: parseFloat(data.eflhCooling) || 400.0,
        seerBase: parseFloat(data.seerBase) || 13.0,
        eerEfficient: parseFloat(data.eerEfficient) || 22.43,
        factorSeerToEer: parseFloat(data.factorSeerToEer) || 1.02,
        kilowattConversionFactor: parseFloat(data.kilowattConversionFactor) || 1000.0,
        btuHeat: parseFloat(data.btuHeat) || 33200.0,
        btuCool: parseFloat(data.btuCool) || 30000.0,
        hspfBase: parseFloat(data.hspfBase) || 7.7,
        copEfficient: parseFloat(data.copEfficient) || 4.18,
        conversionWattsToBtu: parseFloat(data.conversionWattsToBtu) || 3.412,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        groundSourceHeatPumpData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Ground Source Heat Pump calculation saved to project successfully.",
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
  const calculateResults = (inputs: GroundSourceHeatPumpCalculationInputs): GroundSourceHeatPumpCalculationResults => {
    // Gas savings formula: ((EFLH_heating × Btu/h_heat × ((1 / HSPF_base) – (1 / (COP_ee × 3.412))) / 1000) / 277.78
    const gasSavings = ((inputs.eflhHeating * inputs.btuHeat * ((1 / inputs.hspfBase) - (1 / (inputs.copEfficient * inputs.conversionWattsToBtu))) / inputs.kilowattConversionFactor) / 277.78);
    
    // Electricity savings formula: ((EFLH_cooling * Btu/h_cool *((1/SEER_base)-(1/(EER_efficient equipment*1.02))))/1000)/277.78
    // Debug calculation step by step
    const step1 = 1 / inputs.seerBase; // 1/13 = 0.0769230769
    const step2 = 1 / (inputs.eerEfficient * 1.02); // 1/(22.43 * 1.02) = 1/22.8786 = 0.0437217127
    const step3 = step1 - step2; // 0.0769230769 - 0.0437217127 = 0.0332013642
    const step4 = inputs.eflhCooling * inputs.btuCool * step3; // 400 * 30000 * 0.0332013642 = 398416.3704
    const step5 = step4 / inputs.kilowattConversionFactor; // 398416.3704 / 1000 = 398.4163704
    const electricitySavings = step5 / 277.78; // 398.4163704 / 277.78 = 1.434377827
    
    // Log for debugging
    console.log('Ground Source Heat Pump Electricity Calculation Debug:');
    console.log('EFLH_cooling:', inputs.eflhCooling);
    console.log('Btu/h_cool:', inputs.btuCool);
    console.log('SEER_base:', inputs.seerBase);
    console.log('EER_efficient:', inputs.eerEfficient);
    console.log('Step 1 (1/SEER_base):', step1);
    console.log('Step 2 (1/(EER_efficient * 1.02)):', step2);
    console.log('Step 3 (difference):', step3);
    console.log('Step 4 (EFLH * BTU * difference):', step4);
    console.log('Step 5 (step4 / 1000):', step5);
    console.log('Final result (step5 / 277.78):', electricitySavings);

    return {
      annualEnergySavingsGas: gasSavings,
      annualEnergySavingsElectricity: electricitySavings,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      annualEnergySavingsGas: results.annualEnergySavingsGas,
      annualEnergySavingsElectricity: results.annualEnergySavingsElectricity,
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
                    <Zap className="text-purple-600 text-3xl" />
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Ground Source Heat Pump Calculator</h1>
                      <p className="text-lg text-gray-600">Ground Source Heat Pump, Natural Gas and Electric Backup</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CommonValuesDialog 
                      values={getCommonValues('gshp')} 
                      title="Common Values for Ground Source Heat Pump Calculations"
                    />
                    <Button onClick={handleSaveToProject} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2" disabled={saveToProject.isPending}>
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
                      <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Measure Name:</strong> Ground Source Heat Pump</div>
                        <div><strong>Category:</strong> Space Heating & Cooling</div>
                        <div><strong>Lifetime:</strong> 15 years</div>
                        <div><strong>Source:</strong> 2020 Technical Reference Manual, Public Service Commission of Wisconsin</div>
                      </div>
                    </div>

                    {/* Measure Overview */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Measure Overview</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <div><strong>Base Case:</strong> Heating Equipment with HSPF 7.7 (COP≈2.26) and Cooling Equipment with SEER 13</div>
                        <div><strong>Efficient Case:</strong> New GSHP with Heating COP 4.18 and Cooling EER 22.43</div>
                        <div><strong>Source:</strong> 2020 TRM, Public Service Commission of Wisconsin, Pages 826–827</div>
                      </div>
                    </div>

                    {/* Calculation Values */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Values</h3>
                      
                      {/* EFLH Values */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">EFLH Values (Common Values)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="eflhHeating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EFLH Heating (hours)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values C2</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="eflhCooling"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EFLH Cooling (hours)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values C3</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Equipment Ratings */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Equipment Ratings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="seerBase"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SEER Base (ratio)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values C11</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="eerEfficient"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EER Efficient (ratio)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: 2020 TRM, Wisconsin</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="hspfBase"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>HSPF Base (ratio)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: IECC 2009</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="copEfficient"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>COP Efficient (ratio)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: 2020 TRM</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Heat/Cool Capacity */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Heat/Cool Capacity (Common Values)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="btuHeat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>BTU Heat (BTU/hr)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values E14</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="btuCool"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>BTU Cool (BTU/hr)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: Common Values E15</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Conversion Constants */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-800 mb-3">Conversion Constants</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="factorSeerToEer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Factor SEER to EER</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Source: 2020 TRM</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="kilowattConversionFactor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kilowatt Conversion (W/kW)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Engineering constant</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="conversionWattsToBtu"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Watts to BTU</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Engineering constant</p>
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
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="text-purple-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Outputs</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="text-red-600 w-5 h-5" />
                      <span className="text-sm font-medium text-red-900">Annual Energy Savings - Gas</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{results.annualEnergySavingsGas.toFixed(6)} GJ</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="text-blue-600 w-5 h-5" />
                      <span className="text-sm font-medium text-blue-900">Annual Energy Savings - Electricity</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{results.annualEnergySavingsElectricity.toFixed(6)} GJ</p>
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