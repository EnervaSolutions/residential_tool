import { useEffect, useMemo } from "react";
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
import { insertWindowCalculationSchema } from "@shared/schema";
import { calculateWindowSavings, type CalculationInputs } from "@/lib/calculations";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";

const defaultValues: CalculationInputs = {
  uBaseline: 2,
  uUpgrade: 1.22,
  windowArea: 1.11484,
  heatingDegreeDays: 5092,
  coolingDegreeDays: 685,
  hoursPerDay: 24,
  adjWindow: 0.63,
  dua: 0.75,
  heatingEfficiency: 80,
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
    defaultValues: (project as any)?.windowsData || defaultValues,
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
    <div className="p-8">
      {/* Technology Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Calculator className="text-blue-600 text-3xl" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Window Replacement Technology</h1>
              <p className="text-lg text-gray-600">Energy Efficiency Retrofit Calculator</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CommonValuesDialog 
              values={getCommonValues('windows')} 
              title="Common Values for Window Calculations"
            />
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2" disabled={saveCalculation.isPending}>
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
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Measure Overview</h2>
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
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <Calculator className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Calculation Inputs</h2>
              </div>

              <Form {...form}>
                <div className="space-y-8">
                  {/* Window Properties Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">Window Properties</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                      control={form.control}
                      name="uBaseline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Thermal Transmittance of Baseline Case Window (W/m²·K), U Baseline
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
                      name="heatingEfficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Heating System Efficiency (%)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Common Value</p>
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
                            Cooling System Efficiency (SEER)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Common Value</p>
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
                            Percentage Air Conditioning (%)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                            Hours per Day
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Time conversion factor</p>
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
                            Window Adjustment Factor (ADJ window)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Efficiency adjustment factor</p>
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
                            Discretionary Use Adjustment (DUA)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Behavioral adjustment factor</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Conversion Factors Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Factors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="whToKwh"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Wh to kWh Conversion
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.001" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Energy unit conversion</p>
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
                              BTU to kBTU Conversion
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Heat unit conversion</p>
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
                              kWh to GJ Conversion
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Final energy conversion</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="text-green-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Output</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Flame className="text-green-600 w-5 h-5" />
                    <span className="text-sm font-medium text-green-900">Annual Gas Savings</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{results.gasSavings.toFixed(6)} GJ</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="text-blue-600 w-5 h-5" />
                    <span className="text-sm font-medium text-blue-900">Annual Electricity Savings</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{results.electricitySavings.toFixed(6)} GJ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}