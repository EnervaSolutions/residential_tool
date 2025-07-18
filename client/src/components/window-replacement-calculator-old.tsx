import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Calculator, Save, TrendingUp, Flame, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertWindowCalculationSchema, type InsertWindowCalculation } from "@shared/schema";
import { calculateWindowSavings, type CalculationInputs } from "@/lib/calculations";

const defaultValues: CalculationInputs = {
  uBaseline: 2,
  uUpgrade: 1.22,
  windowArea: 1.11484,
  heatingDegreeDays: 5092,
  coolingDegreeDays: 685,
  hoursPerDay: 24,
  adjWindow: 0.63,
  dua: 0.75,
  heatingEfficiency: 80, // Changed from 0.8 to 80 (percentage format)
  coolingEfficiency: 13.40,
  percentageAirConditioning: 37,
  whToKwh: 0.001,
  btuToKbtu: 1000,
  kwhToGj: 0.0036
};

export function WindowReplacementCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  // Load project data to get saved calculator values
  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<CalculationInputs>({
    resolver: zodResolver(insertWindowCalculationSchema.omit({ name: true, notes: true, gasSavings: true, electricitySavings: true })),
    defaultValues: project?.windowsData || defaultValues,
    mode: "onChange"
  });

  // Update form when project data loads
  useEffect(() => {
    if (project?.windowsData) {
      form.reset(project.windowsData);
    }
  }, [project?.windowsData, form]);

  const saveCalculation = useMutation({
    mutationFn: async (data: CalculationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      const projectUpdateData = {
        windowsData: {
          ...data,
          gasSavings: results.gasSavings,
          electricitySavings: results.electricitySavings
        }
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Windows Data Saved",
        description: "Your windows calculation has been saved to the project.",
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
    return calculateWindowSavings(watchedValues);
  }, [
    watchedValues.uBaseline,
    watchedValues.uUpgrade,
    watchedValues.windowArea,
    watchedValues.heatingDegreeDays,
    watchedValues.coolingDegreeDays,
    watchedValues.hoursPerDay,
    watchedValues.adjWindow,
    watchedValues.dua,
    watchedValues.heatingEfficiency,
    watchedValues.coolingEfficiency,
    watchedValues.percentageAirConditioning,
    watchedValues.whToKwh,
    watchedValues.btuToKbtu,
    watchedValues.kwhToGj
  ]);



  return (
    <>
      <div className="p-8">
        {/* Technology Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Calculator className="text-primary text-2xl" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Window Replacement Technology</h1>
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
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 font-medium">Window Replacement</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">Fenestration</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lifetime</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">20 years</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Case</label>
                      <div className="p-3 bg-red-50 rounded-md text-gray-600 text-sm">New window with U value of 2.0 W/m²·K</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Efficient Case</label>
                      <div className="p-3 bg-green-50 rounded-md text-gray-600 text-sm">New window with U value of 1.22 W/m²·K</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Measure Description</h4>
                  <p className="text-sm text-gray-700">Installing triple pane windows with a USI value of 1.22, instead of windows with a USI value of 2.</p>
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
                      
                      {/* Window Properties */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Window Properties</h3>
                        
                        <FormField
                          control={form.control}
                          name="uBaseline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Thermal Transmittance of Base Case Window (W/m²·K), U Baseline
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: Table 9.7.3.3, NBC 2015</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="uUpgrade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Thermal Transmittance of Efficient Case Window (W/m²·K), U Upgrade
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Source: NRCan Requirement</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="windowArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Window Area (m²)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Based on 3ft x 4ft</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="heatingDegreeDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Heating Degree Days (C-days)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Value</p>
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
                                Cooling Degree Days (C-days)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Common Value</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hoursPerDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Conversion Factor for Days to Hours
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Constant</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adjWindow"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Adjustment Factor - Calculation to Observed Results
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
                      </div>

                      {/* System Properties */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">System Properties</h3>
                        
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
                          name="heatingEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Efficiency of Heating System
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
                          name="coolingEfficiency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Efficiency of Cooling System (SEER)
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
                          name="whToKwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Conversion Factor for Wh to kWh
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

                        <FormField
                          control={form.control}
                          name="btuToKbtu"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Conversion Factor from Btu to kBtu
                              </FormLabel>
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

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-success bg-opacity-10 p-2 rounded-lg">
                    <TrendingUp className="text-success text-xl" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Energy Savings Results</h2>
                </div>

                <div className="space-y-6">
                  {/* Gas Savings */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Annual Gas Savings</span>
                      <Flame className="text-blue-600 w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.gasSavings.toFixed(6)} <span className="text-sm font-normal text-gray-600">GJ</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Heating energy reduction</p>
                  </div>

                  {/* Electricity Savings */}
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Annual Electricity Savings</span>
                      <Zap className="text-yellow-600 w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.electricitySavings.toFixed(6)} <span className="text-sm font-normal text-gray-600">GJ</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Cooling energy reduction</p>
                  </div>

                  {/* Calculation Summary */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Calculation Summary</h4>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Delta U-Value:</span>
                        <span className="font-mono">{results.deltaU.toFixed(2)} W/m²·K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Window Area:</span>
                        <span className="font-mono">{watchedValues.windowArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HDD:</span>
                        <span className="font-mono">{watchedValues.heatingDegreeDays.toLocaleString()} C-d</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CDD:</span>
                        <span className="font-mono">{watchedValues.coolingDegreeDays.toLocaleString()} C-d</span>
                      </div>
                    </div>
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
