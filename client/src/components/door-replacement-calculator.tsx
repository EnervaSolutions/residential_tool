import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Calculator, Save, TrendingUp, Flame, Zap, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDoorCalculationSchema } from "@shared/schema";
import { calculateDoorSavings, type DoorCalculationInputs } from "@/lib/door-calculations";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";

const defaultValues: DoorCalculationInputs = {
  conversionFactor: 5.678,
  rExisting: 2.839, // This will be calculated, but kept for form compatibility
  rNew: 4.76, // This will be calculated, but kept for form compatibility
  doorAreaM2: 2,
  doorAreaFt2: 21.52, // 10.76 × 2
  heatingDegreeDays: 5092,
  coolingDegreeDays: 685,
  heatingEfficiency: 0.8, // Decimal form, not percentage
  coolingEfficiency: 13.40,
  percentageAirConditioning: 37,
  dua: 0.75,
  kwhToGj: 0.0036
};

export function DoorReplacementCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  // Load project data to get saved calculator values
  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<DoorCalculationInputs>({
    resolver: zodResolver(insertDoorCalculationSchema.omit({ 
      name: true, 
      notes: true, 
      heatingKwh: true,
      coolingKwh: true,
      gasSavings: true, 
      electricitySavings: true 
    })),
    defaultValues: project?.doorsData || defaultValues,
    mode: "onChange"
  });

  // Update form when project data loads
  useEffect(() => {
    if (project?.doorsData) {
      form.reset(project.doorsData);
    }
  }, [project?.doorsData, form]);

  const saveDoorCalculation = useMutation({
    mutationFn: async (data: DoorCalculationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      const projectUpdateData = {
        doorsData: {
          ...data,
          heatingKwh: results.heatingKwh,
          coolingKwh: results.coolingKwh,
          gasSavings: results.gasSavings,
          electricitySavings: results.electricitySavings
        }
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Doors Data Saved",
        description: "Your doors calculation has been saved to the project.",
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
    saveDoorCalculation.mutate(formData);
  };

  const watchedValues = form.watch();

  // Auto-calculate door area in ft² and memoize calculation results
  const { doorAreaFt2, results } = useMemo(() => {
    const calculatedDoorAreaFt2 = watchedValues.doorAreaM2 * 10.76;
    const inputs = { ...watchedValues, doorAreaFt2: calculatedDoorAreaFt2 };
    const calculationResults = calculateDoorSavings(inputs);
    
    return {
      doorAreaFt2: calculatedDoorAreaFt2,
      results: calculationResults
    };
  }, [
    watchedValues.conversionFactor,
    watchedValues.rExisting,
    watchedValues.rNew,
    watchedValues.doorAreaM2,
    watchedValues.heatingDegreeDays,
    watchedValues.coolingDegreeDays,
    watchedValues.heatingEfficiency,
    watchedValues.coolingEfficiency,
    watchedValues.percentageAirConditioning,
    watchedValues.dua,
    watchedValues.kwhToGj
  ]);



  return (
    <>
      <div className="p-8">
        {/* Technology Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Home className="text-orange-600 text-3xl" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Door Replacement Technology</h1>
                <p className="text-lg text-gray-600">Energy Efficiency Retrofit Calculator</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CommonValuesDialog 
                values={getCommonValues('doors')} 
                title="Common Values for Door Calculations"
              />
              <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2" disabled={saveDoorCalculation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveDoorCalculation.isPending ? "Saving..." : "Save to Project"}
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Measure Overview */}
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Measure Overview</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Technology Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 font-medium">Door Replacement</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">Building Envelope</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Case</label>
                      <div className="p-3 bg-red-50 rounded-md text-gray-600 text-sm">Doors with area of 2m² and R-Value of 2.839</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Efficient Case</label>
                      <div className="p-3 bg-green-50 rounded-md text-gray-600 text-sm">Doors with area of 2m² and R-Value of 4.76</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Measure Description</h4>
                  <p className="text-sm text-gray-700">Energy and demand saving are realized through reductions in the building cooling and heating loads.</p>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Inputs */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-accent bg-opacity-10 p-2 rounded-lg">
                    <Calculator className="text-accent text-xl" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Calculation Values</h2>
                </div>

                <Form {...form}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Door Properties */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Door Properties</h3>
                        
                        <FormField
                          control={form.control}
                          name="conversionFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Conversion Factor (W/m²·K to BTU/h·ft²·°F)
                              </FormLabel>
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            R_existing - Existing Door Heat Loss Coefficient
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                            {results.rExisting.toFixed(3)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Calculated: 1 / (2 / Conversion Factor)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            R_new - New Door Heat Loss Coefficient  
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                            {results.rNew.toFixed(3)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Calculated: 1 / 0.21 (NRCan Requirement)</p>
                        </div>

                        <FormField
                          control={form.control}
                          name="doorAreaM2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Door Area (m²)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Assumed</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Door Area (ft²)
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md text-gray-600">
                            {doorAreaFt2.toFixed(2)} ft²
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Calculated: 10.76 × Door Area (m²)</p>
                        </div>

                        <FormField
                          control={form.control}
                          name="heatingDegreeDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Heating Degree Days (HDD)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Values</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="coolingDegreeDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Cooling Degree Days (CDD)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Values</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* System Properties */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">System Properties</h3>
                        
                        <FormField
                          control={form.control}
                          name="heatingEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Efficiency of Heating System (decimal)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  max="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Values (0.8 = 80%)</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="coolingEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Seasonal Efficiency of Cooling System (SEER)
                              </FormLabel>
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

                        <FormField
                          control={form.control}
                          name="percentageAirConditioning"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Percentage of Air Conditioning (%)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  min="0"
                                  max="100"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Values</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dua"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                DUA (Discretionary Use Adjustment)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Iowa TRM</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="kwhToGj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Conversion Factor for kWh to GJ
                              </FormLabel>
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
                    <p className="text-2xl font-bold text-green-600">{results.gasSavings.toFixed(10)} GJ</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="text-purple-600 w-5 h-5" />
                      <span className="text-sm font-medium text-purple-900">Annual Electricity Savings</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{results.electricitySavings.toFixed(10)} GJ</p>
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