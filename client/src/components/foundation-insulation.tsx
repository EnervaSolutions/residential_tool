import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Fan, Save, Flame, Zap } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MeasureInterface } from "./measure-interface";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { FoundationInsulationInputs, FoundationInsulationConstants, FoundationInsulationCalculationData } from "@/lib/calculations";
import { calculateFoundationInsulationSavings } from "@/lib/calculations";

const defaultValues: FoundationInsulationInputs = {
    percentageAC:0.37,
    rOldAboveGrade:2.00,
    lengthBasementWall:125.00,
    cDD:1232.00,
    efficiencyAC:13.40,
    hDD:9166.00,
    rOldBelowGrade:7.4,
    efficiencyHeating:0.80,
};

// Constants that are not editable
const foundationInsulationConstants: FoundationInsulationConstants = {
    rAdded:12.00,
    heightBasementWallAbove:3.00,
    basementFramFactor:0.25,
    numHoursDay:24.00,
    discretUseAdjustment:0.75,
    btuToKbtu:1000,
    adjustCoolingSaving:0.75,
    heightBasementWallBelow:5.00,
    btuToTherm:100000,
    adjustHeatSaving:0.73,
    kwhToGj:0.0036,
    thermToGj:0.105506,
};

export function FoundationInsulationCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<FoundationInsulationInputs>({
    defaultValues: (project as any)?.foundationInsulationData || defaultValues,
    mode: "onChange"
  });

  const saveCalculation = useMutation({
    mutationFn: async (data: FoundationInsulationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      // Calculate results for saving
      const combinedData: FoundationInsulationCalculationData = {
        ...data,
        ...foundationInsulationConstants
      };
      const calculatedResults = calculateFoundationInsulationSavings(combinedData);
      
      const projectUpdateData = {
        foundationInsulationData: {
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
        title: "Foundation Insulation Data Saved",
        description: "Your Foundation Insulation calculation has been saved to the project.",
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
    const combinedData: FoundationInsulationCalculationData = {
      ...watchedValues,
      ...foundationInsulationConstants
    };
    return calculateFoundationInsulationSavings(combinedData);
  }, [
    watchedValues.percentageAC,
    watchedValues.rOldAboveGrade,
    watchedValues.lengthBasementWall,
    watchedValues.cDD,
    watchedValues.efficiencyAC,
    watchedValues.hDD,
    watchedValues.rOldBelowGrade,
    watchedValues.efficiencyHeating,
  ]);

  const overview = {
    technologyName: "Foundation Insulation",
    category: "Building Envelope",
    lifetime: "30 years",
    baseCase: "Existing foundation insulation",
    efficientCase: "Adding R-12 insulation to existing foundation",
    description: "Install foundation insulation to reduce heat loss through basement walls"
  };

  const calculationInputs = (
    <Form {...form}>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">
            Foundation Insulation System Properties
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
              <label className="block text-sm font-medium text-gray-700 mb-1">R-Value Added</label>
              <Input 
                type="number" 
                title="Constant"
                value={foundationInsulationConstants.rAdded}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">R-value of added insulation</p>
            </div>

            <FormField
              control={form.control}
              name="rOldAboveGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>R-Value Old Above Grade</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">R-value of existing insulation above grade</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lengthBasementWall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length of Basement Wall (ft)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Linear feet of basement wall perimeter</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height Basement Wall Above Grade (ft)</label>
              <Input 
                type="number" 
                title="Constant"
                value={foundationInsulationConstants.heightBasementWallAbove}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Height of basement wall above grade (ft)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basement Framing Factor</label>
              <Input 
                type="number" 
                title="Constant"
                value={foundationInsulationConstants.basementFramFactor}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Framing factor for basement walls</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Day</label>
              <Input 
                type="number" 
                title="Constant"
                value={foundationInsulationConstants.numHoursDay}
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
                value={foundationInsulationConstants.discretUseAdjustment}
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
                value={foundationInsulationConstants.adjustCoolingSaving}
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
              name="rOldBelowGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>R-Value Old Below Grade</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">R-value of existing insulation below grade</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height Basement Wall Below Grade</label>
              <Input 
                type="number" 
                title="Constant"
                value={foundationInsulationConstants.heightBasementWallBelow}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Height of basement wall below grade (ft)</p>
            </div>

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
                value={foundationInsulationConstants.adjustHeatSaving}
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
                value={foundationInsulationConstants.btuToKbtu}
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
                value={foundationInsulationConstants.btuToTherm}
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
                value={foundationInsulationConstants.kwhToGj}
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
                value={foundationInsulationConstants.thermToGj}
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
        <p className="text-2xl font-bold text-blue-600">{results.electricCoolingSavings.toFixed(6)} GJ</p>
      </div>
      
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
            <Flame className="text-green-600 w-5 h-5" />
          <span className="text-sm font-medium text-green-900">Annual Gas Heating Savings</span>
        </div>
        <p className="text-2xl font-bold text-green-600">{results.gasHeatingSavings.toFixed(6)} GJ</p>
      </div>
      
      <div className="p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
            <Fan className="text-purple-600 w-5 h-5" />
          <span className="text-sm font-medium text-purple-900">Total Annual Savings</span>
        </div>
        <p className="text-2xl font-bold text-purple-600">{results.totalSavings.toFixed(6)} GJ</p>
      </div>
    </div>
  );

  const headerActions = (
    <>
      <CommonValuesDialog 
        values={getCommonValues('foundationInsulation')} 
        title="Common Values for Foundation Insulation Calculations"
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
      title="Foundation Insulation"
      subtitle="Energy Efficiency Retrofit Calculator"
      icon={<Fan />}
      overview={overview}
      calculationInputs={calculationInputs}
      output={output}
      headerActions={headerActions}
    />
  );
}