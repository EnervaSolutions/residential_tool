import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Snowflake, TrendingUp, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect } from "react";

// DMSHP calculation input schema
const dmshpInputSchema = z.object({
  annualNaturalGasUse: z.number().min(0),
  annualSpaceHeatingEnergy: z.number().min(0),
  furnaceEfficiency: z.number().min(0),
  houseGasHeatingCapacity: z.number().min(0),
  houseCoolingCapacity: z.number().min(0),
  eflhHeating: z.number().min(0),
  eflhCooling: z.number().min(0),
  dmshpSeer: z.number().min(0),
  dmshpHspf: z.number().min(0),
  dmshpFactor: z.number().min(0),
  wToKwhConversion: z.number().min(0),
  kwhToGjConversion: z.number().min(0),
});

type DmshpCalculationInputs = z.infer<typeof dmshpInputSchema>;

interface DmshpCalculationResults {
  annualEnergySavingsGas: number;
  annualEnergySavingsHeatingElectricity: number;
  annualEnergySavingsCoolingElectricity: number;
}

export default function DmshpCalculator() {
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

  const form = useForm<DmshpCalculationInputs>({
    resolver: zodResolver(dmshpInputSchema),
    defaultValues: {
      annualNaturalGasUse: 113.0, // Common Values C13
      annualSpaceHeatingEnergy: 83.281, // Calculated: 113 × 0.737
      furnaceEfficiency: 0.78, // Common Values C8 (78%)
      houseGasHeatingCapacity: 33200, // Common Values E14
      houseCoolingCapacity: 30000, // Common Values E15
      eflhHeating: 1315.0, // Common Values C2
      eflhCooling: 400.0, // Common Values C3
      dmshpSeer: 15.0, // ENERGY STAR (24k–36k BTU)
      dmshpHspf: 8.2, // Cadmus 2016
      dmshpFactor: 0.25, // Cadmus 2016
      wToKwhConversion: 1000.0, // Engineering constant
      kwhToGjConversion: 0.0036, // Cadmus 2016
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.dmshpData) {
      const data = project.dmshpData as any;
      form.reset({
        annualNaturalGasUse: parseFloat(data.annualNaturalGasUse) || 113.0,
        annualSpaceHeatingEnergy: parseFloat(data.annualSpaceHeatingEnergy) || 83.281,
        furnaceEfficiency: parseFloat(data.furnaceEfficiency) || 0.78,
        houseGasHeatingCapacity: parseFloat(data.houseGasHeatingCapacity) || 33200,
        houseCoolingCapacity: parseFloat(data.houseCoolingCapacity) || 30000,
        eflhHeating: parseFloat(data.eflhHeating) || 1315.0,
        eflhCooling: parseFloat(data.eflhCooling) || 400.0,
        dmshpSeer: parseFloat(data.dmshpSeer) || 15.0,
        dmshpHspf: parseFloat(data.dmshpHspf) || 8.2,
        dmshpFactor: parseFloat(data.dmshpFactor) || 0.25,
        wToKwhConversion: parseFloat(data.wToKwhConversion) || 1000.0,
        kwhToGjConversion: parseFloat(data.kwhToGjConversion) || 0.0036,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        dmshpData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "DMSHP calculation saved to project successfully.",
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
  const calculateResults = (inputs: DmshpCalculationInputs): DmshpCalculationResults => {
    // Annual Energy Savings - Gas = Annual Space Heating Energy
    const gasSavings = inputs.annualSpaceHeatingEnergy;
    
    // Annual Energy Savings - Heating Electricity Consumption = -1 × (House Gas Heating Capacity × EFLH_heating) ÷ HSPF ÷ 1000 × 0.0036
    const heatingElectricity = -1 * (inputs.houseGasHeatingCapacity * inputs.eflhHeating) / inputs.dmshpHspf / inputs.wToKwhConversion * inputs.kwhToGjConversion;
    
    // Annual Energy Savings - Cooling Electricity Consumption = -1 × (House Cooling Capacity × EFLH_cooling) ÷ SEER ÷ 1000 × 0.0036
    const coolingElectricity = -1 * (inputs.houseCoolingCapacity * inputs.eflhCooling) / inputs.dmshpSeer / inputs.wToKwhConversion * inputs.kwhToGjConversion;

    return {
      annualEnergySavingsGas: gasSavings,
      annualEnergySavingsHeatingElectricity: heatingElectricity,
      annualEnergySavingsCoolingElectricity: coolingElectricity,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      annualEnergySavingsGas: results.annualEnergySavingsGas,
      annualEnergySavingsHeatingElectricity: results.annualEnergySavingsHeatingElectricity,
      annualEnergySavingsCoolingElectricity: results.annualEnergySavingsCoolingElectricity,
    };
    saveToProject.mutate(calculationData);
  };

  // Auto-calculate Annual Space Heating Energy when Annual Natural Gas Use changes
  useEffect(() => {
    const gasUse = watchedValues.annualNaturalGasUse;
    const spaceHeatingEnergy = gasUse * 0.737; // NRCan: 73.7% gas is for heating
    form.setValue("annualSpaceHeatingEnergy", spaceHeatingEnergy);
  }, [watchedValues.annualNaturalGasUse, form]);

  return (
    <div className="p-8">
      {/* Technology Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Snowflake className="text-primary text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DMSHP Technology</h1>
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
              <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                <div><strong>Measure Name:</strong> Residential-sized ductless mini-split heat pump replacing existing furnace</div>
                <div><strong>Category:</strong> Space Heating</div>
                <div><strong>Lifetime:</strong> 18 years</div>
                <div><strong>Source:</strong> Iowa Energy Efficiency Statewide Technical Reference Manual — 2.4.7 Ductless Heat Pumps</div>
              </div>
              
              {/* Description */}
              <div className="space-y-3">
                <p className="text-gray-700"><strong>Description:</strong> Installing Ductless Mini Split with 1 Head to Replace Furnace and add cooling. Furnace remains as emergency backup.</p>
                <p className="text-gray-700"><strong>Base Case:</strong> Existing furnace, no cooling</p>
                <p className="text-gray-700"><strong>Efficient Case:</strong> DMSHP with COP of 2.72</p>
                <p className="text-gray-700"><strong>Source:</strong> Mid-Atlantic TRM Version 8 (May 2018), Page 90</p>
              </div>
            </CardContent>
          </Card>

          {/* Input Parameters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
                  <Snowflake className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Input Parameters</h2>
              </div>
              
              <Form {...form}>
                <div className="space-y-8">

                    {/* Natural Gas Data */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Natural Gas Data</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormField
                          control={form.control}
                          name="annualSpaceHeatingEnergy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Space Heating Energy (GJ)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Formula: Annual Gas Use × 0.737</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Equipment Data */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Data</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="furnaceEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Furnace Efficiency (decimal)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Common Values C8</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="houseGasHeatingCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>House Gas Heating Capacity (BTU/h)</FormLabel>
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
                          name="houseCoolingCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>House Cooling Capacity (BTU/h)</FormLabel>
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

                    {/* DMSHP Specifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">DMSHP Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="dmshpSeer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DMSHP SEER</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">ENERGY STAR (24k–36k BTU)</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dmshpHspf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DMSHP HSPF</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Cadmus 2016</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dmshpFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DMSHP Factor</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Cadmus 2016</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Conversion Constants */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Constants</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="wToKwhConversion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>W to kWh Conversion (W/kW)</FormLabel>
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
                          name="kwhToGjConversion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>kWh to GJ Conversion</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.0001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Cadmus 2016</p>
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
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="text-blue-600 text-xl" />
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

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="text-red-600 w-5 h-5" />
                    <span className="text-sm font-medium text-red-900">Annual Energy Savings - Heating Electricity</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{results.annualEnergySavingsHeatingElectricity.toFixed(6)} GJ</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="text-blue-600 w-5 h-5" />
                    <span className="text-sm font-medium text-blue-900">Annual Energy Savings - Cooling Electricity</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{results.annualEnergySavingsCoolingElectricity.toFixed(6)} GJ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}