import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Wind, Save, TrendingUp, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAirSealingCalculationSchema } from "@shared/schema";
import { calculateAirSealingSavings, type AirSealingCalculationInputs } from "@/lib/calculations";

const defaultValues: AirSealingCalculationInputs = {
  airChanges: 1.5,
  floorArea: 2099,
  ceilingHeight: 9,
  thermostatSetPoint: 72,
  outsideTemperature: 13.3,
  temperatureDifference: 58.7,
  heatingSystemEfficiency: 0.8,
  conversionBtuToTherms: 100000,
  annualHoursBelowSetpoint: 5544,
  savingsFraction: 0.1,
  conversionThermsToGj: 0.105506
};

export function AirSealingCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  // Load project data to get saved calculator values
  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<AirSealingCalculationInputs>({
    resolver: zodResolver(insertAirSealingCalculationSchema.omit({ name: true, notes: true, volumeRateInfiltration: true, gasSavings: true })),
    defaultValues: project?.airSealingData || defaultValues,
    mode: "onChange"
  });

  // Update form when project data loads
  useEffect(() => {
    if (project?.airSealingData) {
      form.reset(project.airSealingData);
    }
  }, [project?.airSealingData, form]);

  const saveCalculation = useMutation({
    mutationFn: async (data: AirSealingCalculationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      const projectUpdateData = {
        airSealingData: {
          ...data,
          volumeRateInfiltration: results.volumeRateInfiltration,
          gasSavings: results.gasSavings
        }
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Air Sealing Data Saved",
        description: "Your air sealing calculation has been saved to the project.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save calculation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const formData = form.getValues();
    saveCalculation.mutate(formData);
  };

  const watchedValues = form.watch();

  // Memoize the calculation results to prevent infinite rerenders
  const results = useMemo(() => {
    return calculateAirSealingSavings(watchedValues);
  }, [
    watchedValues.airChanges,
    watchedValues.floorArea,
    watchedValues.ceilingHeight,
    watchedValues.thermostatSetPoint,
    watchedValues.outsideTemperature,
    watchedValues.temperatureDifference,
    watchedValues.heatingSystemEfficiency,
    watchedValues.conversionBtuToTherms,
    watchedValues.annualHoursBelowSetpoint,
    watchedValues.savingsFraction,
    watchedValues.conversionThermsToGj
  ]);

  const handleSaveCalculation = (name: string, notes?: string) => {
    const calculationData: InsertAirSealingCalculation = {
      name,
      notes,
      ...watchedValues,
      volumeRateInfiltration: results.volumeRateInfiltration.toString(),
      gasSavings: results.gasSavings.toString(),
    };
    saveCalculation.mutate(calculationData);
  };

  const loadCalculation = (calculation: any) => {
    const loadedValues: AirSealingCalculationInputs = {
      airChanges: parseFloat(calculation.airChanges),
      floorArea: parseFloat(calculation.floorArea),
      ceilingHeight: parseFloat(calculation.ceilingHeight),
      thermostatSetPoint: parseFloat(calculation.thermostatSetPoint),
      outsideTemperature: parseFloat(calculation.outsideTemperature),
      temperatureDifference: parseFloat(calculation.temperatureDifference),
      heatingSystemEfficiency: parseFloat(calculation.heatingSystemEfficiency),
      conversionBtuToTherms: parseFloat(calculation.conversionBtuToTherms),
      annualHoursBelowSetpoint: parseFloat(calculation.annualHoursBelowSetpoint),
      savingsFraction: parseFloat(calculation.savingsFraction),
      conversionThermsToGj: parseFloat(calculation.conversionThermsToGj),
    };
    
    form.reset(loadedValues);
    toast({
      title: "Calculation Loaded",
      description: `Loaded "${calculation.name}" successfully.`,
    });
  };

  return (
    <>
      <div className="p-8">
        {/* Technology Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Wind className="text-primary text-2xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Air Sealing Technology</h1>
                <p className="text-sm text-gray-600">Energy Efficiency Retrofit Calculator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleSave} className="bg-primary hover:bg-blue-700" disabled={saveCalculation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveCalculation.isPending ? "Saving..." : "Save to Project"}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Technology Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 font-medium">Air Sealing</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">Building Envelope</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lifetime</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">15 years</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Case</label>
                      <div className="p-3 bg-red-50 rounded-md text-gray-600 text-sm">Standard house with 1.5 ACH infiltration rate</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Efficient Case</label>
                      <div className="p-3 bg-green-50 rounded-md text-gray-600 text-sm">10% reduction in infiltration rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Measure Description</h4>
                  <p className="text-sm text-gray-700">Air sealing without blower door test verification reduces infiltration rates and improves heating efficiency.</p>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Inputs */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-accent bg-opacity-10 p-2 rounded-lg">
                    <Wind className="text-accent text-xl" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Calculation Values</h2>
                </div>

                <Form {...form}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Air Sealing Properties */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Air Sealing Properties</h3>
                        
                        <FormField
                          control={form.control}
                          name="airChanges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Air Changes per Hour (ACH)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="floorArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Floor Area (ft²)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ceilingHeight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Ceiling Height (ft)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Temperature & System Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Temperature & System Settings</h3>
                        
                        <FormField
                          control={form.control}
                          name="thermostatSetPoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Thermostat Set Point (°F)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="outsideTemperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Outside Temperature (°F)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="temperatureDifference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Temperature Difference (°F)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="heatingSystemEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Heating System Efficiency (decimal)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="annualHoursBelowSetpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Annual Hours Below Set Point (hrs)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Conversion Factors</h3>
                        
                        <FormField
                          control={form.control}
                          name="conversionBtuToTherms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                BTU to Therms Conversion
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="1" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="savingsFraction"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Savings Fraction (decimal)
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="conversionThermsToGj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Therms to GJ Conversion
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.000001" onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Results */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="text-green-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Calculation Results</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Flame className="text-green-600 w-5 h-5" />
                      <span className="text-sm font-medium text-green-900">Annual Gas Savings</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{results.gasSavings.toFixed(6)} GJ</p>
                  </div>


                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}