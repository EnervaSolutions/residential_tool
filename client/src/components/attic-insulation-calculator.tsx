import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Calculator, Home, Flame, TrendingUp } from "lucide-react";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { useToast } from "@/hooks/use-toast";
import { 
  AtticInsulationCalculationInputs, 
  AtticInsulationCalculationResults, 
  calculateAtticInsulationSavings 
} from "@/lib/calculations";
import { insertAtticInsulationCalculationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function AtticInsulationCalculator() {
  const [results, setResults] = useState<AtticInsulationCalculationResults>({
    electricitySavings: 0,
    gasSavings: 0,
    totalSavings: 0
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  // Load project data to get saved calculator values
  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const defaultValues = {
    percentageAirConditioning: 37,
    rNew: 55,
    rOld: 10,
    areaInsulatedAttic: 1500,
    atticFramingFactor: 0.07,
    hoursPerDay: 24,
    cdd: 685,
    hdd: 5092,
    discretionaryUseAdjustment: 0.75,
    efficiencyAirConditioning: 13.4,
    efficiencyHeatingSystem: 0.8,
    btuToKbtu: 1000,
    btuToTherm: 100000,
    adjustmentCoolingSavings: 1.14,
    adjustmentGasHeatingSavings: 0.76,
    kwhToGj: 0.0036,
    thermToGj: 0.105506,
  };

  // Form setup with default values from the specification
  const form = useForm<AtticInsulationCalculationInputs>({
    resolver: zodResolver(insertAtticInsulationCalculationSchema.omit({ 
      name: true, 
      notes: true,
      coolingEnergyKwh: true,
      heatingEnergyTherms: true,
      electricitySavings: true,
      gasSavings: true,
      totalSavings: true
    })),
    defaultValues: project?.atticInsulationData || defaultValues
  });

  // Update form when project data loads
  useEffect(() => {
    if (project?.atticInsulationData) {
      form.reset(project.atticInsulationData);
    }
  }, [project?.atticInsulationData, form]);

  // Watch form values for real-time calculations
  const watchedValues = form.watch();

  // Calculate results whenever form values change
  useEffect(() => {
    const calculatedResults = calculateAtticInsulationSavings(watchedValues);
    setResults(calculatedResults);
  }, [
    watchedValues.percentageAirConditioning,
    watchedValues.rNew,
    watchedValues.rOld,
    watchedValues.areaInsulatedAttic,
    watchedValues.atticFramingFactor,
    watchedValues.hoursPerDay,
    watchedValues.cdd,
    watchedValues.hdd,
    watchedValues.discretionaryUseAdjustment,
    watchedValues.efficiencyAirConditioning,
    watchedValues.efficiencyHeatingSystem,
    watchedValues.btuToKbtu,
    watchedValues.btuToTherm,
    watchedValues.adjustmentCoolingSavings,
    watchedValues.adjustmentGasHeatingSavings,
    watchedValues.kwhToGj,
    watchedValues.thermToGj,
  ]);

  // Save calculation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AtticInsulationCalculationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      const projectUpdateData = {
        atticInsulationData: {
          ...data,
          coolingEnergyKwh: results.electricitySavings / 0.0036, // Convert back from GJ
          heatingEnergyTherms: results.gasSavings / 0.105506, // Convert back from GJ  
          electricitySavings: results.electricitySavings,
          gasSavings: results.gasSavings,
          totalSavings: results.totalSavings
        }
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attic Insulation Data Saved",
        description: "Your attic insulation calculation has been saved to the project.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save calculation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    const formData = form.getValues();
    saveMutation.mutate(formData);
  };

  return (
    <>
      <div className="p-8">
        {/* Technology Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Home className="text-purple-600 text-3xl" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attic Insulation Technology</h1>
                <p className="text-lg text-gray-600">Energy Efficiency Retrofit Calculator</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CommonValuesDialog 
                values={getCommonValues('attic-insulation')} 
                title="Common Values for Attic Insulation Calculations"
              />
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2" disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save to Project"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Measure Overview */}
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Measure Overview</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Technology Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-900 font-medium">Attic Insulation</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">Building Envelope</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lifetime (Years)</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">20</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Energy Savings</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-600">Heating & Cooling</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculator Inputs */}
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Calculator className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Calculation Inputs</h2>
                </div>
          <form className="space-y-6">
            {/* Insulation Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Insulation Properties</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percentageAirConditioning">Percentage Air Conditioning (%)</Label>
                  <Input
                    id="percentageAirConditioning"
                    type="number"
                    step="0.01"
                    {...form.register("percentageAirConditioning", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rNew">R-Value New</Label>
                  <Input
                    id="rNew"
                    type="number"
                    step="0.01"
                    {...form.register("rNew", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rOld">R-Value Old</Label>
                  <Input
                    id="rOld"
                    type="number"
                    step="0.01"
                    {...form.register("rOld", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaInsulatedAttic">Area Insulated Attic (ft²)</Label>
                  <Input
                    id="areaInsulatedAttic"
                    type="number"
                    step="0.01"
                    {...form.register("areaInsulatedAttic", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="atticFramingFactor">Attic Framing Factor</Label>
                  <Input
                    id="atticFramingFactor"
                    type="number"
                    step="0.01"
                    {...form.register("atticFramingFactor", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">Hours Per Day</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    step="1"
                    {...form.register("hoursPerDay", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Climate Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Climate Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cdd">Cooling Degree Days (CDD)</Label>
                  <Input
                    id="cdd"
                    type="number"
                    step="1"
                    {...form.register("cdd", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hdd">Heating Degree Days (HDD)</Label>
                  <Input
                    id="hdd"
                    type="number"
                    step="1"
                    {...form.register("hdd", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* System Efficiencies */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">System Efficiencies</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discretionaryUseAdjustment">Discretionary Use Adjustment</Label>
                  <Input
                    id="discretionaryUseAdjustment"
                    type="number"
                    step="0.01"
                    {...form.register("discretionaryUseAdjustment", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiencyAirConditioning">Efficiency Air Conditioning (SEER)</Label>
                  <Input
                    id="efficiencyAirConditioning"
                    type="number"
                    step="0.01"
                    {...form.register("efficiencyAirConditioning", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiencyHeatingSystem">Efficiency Heating System</Label>
                  <Input
                    id="efficiencyHeatingSystem"
                    type="number"
                    step="0.01"
                    {...form.register("efficiencyHeatingSystem", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Conversion Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conversion Factors</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="btuToKbtu">BTU to kBTU</Label>
                  <Input
                    id="btuToKbtu"
                    type="number"
                    step="1"
                    {...form.register("btuToKbtu", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btuToTherm">BTU to Therm</Label>
                  <Input
                    id="btuToTherm"
                    type="number"
                    step="1"
                    {...form.register("btuToTherm", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kwhToGj">kWh to GJ</Label>
                  <Input
                    id="kwhToGj"
                    type="number"
                    step="0.000001"
                    {...form.register("kwhToGj", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thermToGj">Therm to GJ</Label>
                  <Input
                    id="thermToGj"
                    type="number"
                    step="0.000001"
                    {...form.register("thermToGj", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Adjustment Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adjustment Factors</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustmentCoolingSavings">Adjustment Cooling Savings</Label>
                  <Input
                    id="adjustmentCoolingSavings"
                    type="number"
                    step="0.01"
                    {...form.register("adjustmentCoolingSavings", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustmentGasHeatingSavings">Adjustment Gas Heating Savings</Label>
                  <Input
                    id="adjustmentGasHeatingSavings"
                    type="number"
                    step="0.01"
                    {...form.register("adjustmentGasHeatingSavings", { 
                      valueAsNumber: true 
                    })}
                  />
                </div>
              </div>
            </div>
          </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Results Section */}
          <div className="lg:col-span-1">
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Energy Savings Results</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Flame className="text-purple-600 text-xl" />
                      <span className="text-lg font-semibold text-purple-800">Gas Savings</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {results.gasSavings.toFixed(6)} GJ
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <TrendingUp className="text-purple-600 text-xl" />
                      <span className="text-lg font-semibold text-purple-800">Electricity Savings</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {results.electricitySavings.toFixed(6)} GJ
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <TrendingUp className="text-purple-600 text-xl" />
                      <span className="text-lg font-semibold text-purple-800">Total Savings</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {results.totalSavings.toFixed(6)} GJ
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