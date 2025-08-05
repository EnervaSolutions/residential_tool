import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Save, Flame, Zap } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MeasureInterface } from "./measure-interface";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { ExteriorWallInsulationInputs, ExteriorWallInsulationConstants, ExteriorWallInsulationCalculationData } from "@/lib/calculations";
import { calculateExteriorWallInsulationSavings } from "@/lib/calculations";

const defaultValues: ExteriorWallInsulationInputs = {
  percentageAC: 0.37,
  rOld: 5.00,
  areaInsulatedWall: 2248.00,
  cDD: 1232.00,
  efficiencyAC: 13.40,
  hDD: 9166.00,
  efficiencyHeating: 0.80,
};

// Constants that are not editable
const exteriorWallInsulationConstants: ExteriorWallInsulationConstants = {
  rNew: 10.00,
  wallFramFactor: 0.25,
  numHoursDay: 24.00,
  discretUseAdjustment: 0.75,
  btuToKbtu: 1000,
  adjustCoolingSaving: 0.75,
  btuToTherm: 100000,
  adjustHeatSaving: 0.63,
  kwhToGj: 0.0036,
  thermToGj: 0.105506,
};

export function ExteriorWallInsulationCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<ExteriorWallInsulationInputs>({
    defaultValues: (project as any)?.exteriorWallInsulationData || defaultValues,
    mode: "onChange"
  });

  const saveCalculation = useMutation({
    mutationFn: async (data: ExteriorWallInsulationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      // Calculate results for saving
      const combinedData: ExteriorWallInsulationCalculationData = {
        ...data,
        ...exteriorWallInsulationConstants
      };
      const calculatedResults = calculateExteriorWallInsulationSavings(combinedData);
      
      const projectUpdateData = {
        exteriorWallInsulationData: {
          ...data,
          electricCoolingSavings: calculatedResults.electricCoolingSavings,
          gasHeatingSavings: calculatedResults.gasHeatingSavings,
          totalSavings: calculatedResults.totalSavings
        }
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exterior Wall Insulation Data Saved",
        description: "Your Exterior Wall Insulation calculation has been saved to the project.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
    },
    onError: () => {
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

  const results = useMemo(() => {
    const combinedData: ExteriorWallInsulationCalculationData = {
      ...watchedValues,
      ...exteriorWallInsulationConstants
    };
    return calculateExteriorWallInsulationSavings(combinedData);
  }, [
    watchedValues.percentageAC,
    watchedValues.rOld,
    watchedValues.areaInsulatedWall,
    watchedValues.cDD,
    watchedValues.efficiencyAC,
    watchedValues.hDD,
    watchedValues.efficiencyHeating,
  ]);

  const overview = {
    technologyName: "Exterior Wall Insulation",
    category: "Building Envelope",
    lifetime: "30 years",
    baseCase: "Existing exterior wall insulation",
    efficientCase: "Upgrading to R-13 insulation on exterior walls",
    description: "Install exterior wall insulation to reduce heat loss through above-grade walls"
  };

  const calculationInputs = (
    <Form {...form}>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">
            Exterior Wall Insulation System Properties
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="percentageAC"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage of Air Conditioning</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Fraction (0-1)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">R-Value New</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.rNew}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">R-value of new insulation</p>
            </div>

            <FormField
              control={form.control}
              name="rOld"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>R-Value Old Wall</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">R-value of existing wall insulation</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areaInsulatedWall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wall Area (sq ft)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Total exterior wall area to be insulated</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wall Framing Factor</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.wallFramFactor}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Framing factor for exterior walls</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Day</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.numHoursDay}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Number of hours in a day</p>
            </div>
            
            <FormField
              control={form.control}
              name="cDD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cooling Degree Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Annual cooling degree days</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discrete Use Adjustment</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.discretUseAdjustment}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Adjustment factor for discrete use</p>
            </div>

            <FormField
              control={form.control}
              name="efficiencyAC"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Air Conditioning Efficiency (SEER)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Seasonal Energy Efficiency Ratio</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cooling Savings Adjustment</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.adjustCoolingSaving}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Adjustment factor for cooling savings</p>
            </div>

            <FormField
              control={form.control}
              name="hDD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heating Degree Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Annual heating degree days</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="efficiencyHeating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heating System Efficiency</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Heating system efficiency (AFUE as decimal)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heat Savings Adjustment</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.adjustHeatSaving}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Adjustment factor for heat savings</p>
            </div>
          </div>
        </div>
        <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Factors (Constants)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BTU to kBTU Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.btuToKbtu}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">BTU to kBTU conversion factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BTU to Therm Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.btuToTherm}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">BTU to therm conversion factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">kWh to GJ Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.kwhToGj}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">kilowatt-hours to gigajoules</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Therm to GJ Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={exteriorWallInsulationConstants.thermToGj}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Therm to gigajoules conversion</p>
            </div>
          </div>
          </div>
      </div>
    </Form>
  );

  const output = (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
            <Zap className="text-blue-600 w-5 h-5" />
          <span className="text-sm font-medium text-blue-900">Annual Electric Cooling Savings</span>
        </div>
        <p className="text-2xl font-bold text-blue-600">{results.electricCoolingSavings.toFixed(4)} GJ</p>
      </div>
      
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
            <Flame className="text-green-600 w-5 h-5" />
          <span className="text-sm font-medium text-green-900">Annual Gas Heating Savings</span>
        </div>
        <p className="text-2xl font-bold text-green-600">{results.gasHeatingSavings.toFixed(4)} GJ</p>
      </div>
      
      <div className="p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
            <Zap className="text-purple-600 w-5 h-5" />
          <span className="text-sm font-medium text-purple-900">Total Annual Savings</span>
        </div>
        <p className="text-2xl font-bold text-purple-600">{results.totalSavings.toFixed(4)} GJ</p>
      </div>
    </div>
  );

  const headerActions = (
    <>
      <CommonValuesDialog 
        values={getCommonValues('exteriorWallInsulation')} 
        title="Common Values for Exterior Wall Insulation Calculations"
      />
      <Button 
        onClick={handleSave} 
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2" 
        disabled={saveCalculation.isPending}
      >
        <Save className="w-4 h-4 mr-2" />
        {saveCalculation.isPending ? "Saving..." : "Save to Project"}
      </Button>
    </>
  );

  return (
    <MeasureInterface
      title="Exterior Wall Insulation"
      subtitle="Energy Efficiency Retrofit Calculator"
      icon={<Zap />}
      overview={overview}
      calculationInputs={calculationInputs}
      output={output}
      headerActions={headerActions}
    />
  );
}