import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Thermometer, Save, Flame, Zap } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MeasureInterface } from "./measure-interface";
import { CommonValuesDialog } from "./common-values-dialog";
import { getCommonValues } from "@/data/common-values";
import { ASHPCalculationInputs, ASHPConstants, ASHPCalculationData } from "@/lib/calculations";
import { calculateASHPSavings } from "@/lib/calculations";

const defaultValues: ASHPCalculationInputs = {
  eflhHeating: 1998.00,
  eflhCooling: 1161.00,
  btuhcExist: 36000.00,
  seerExist: 13.40,
  btuhcEE: 36000.00,
  btuhhExist: 80000.00,
  btuhhEE: 80000.00,
  furnanceEfficieny: 0.80,
  annualNaturalGasUsage: 109.30,
  annualHeatingEnergy: 80.55,
};

// Constants that are not editable
const ashpConstants: ASHPConstants = {
  seerRR: 13.00,
  hspfExist: 7.7,
  hspFee: 8.5,
  furnanceUsageFactor: 0.60,
  adjustmentFactor: 0.67,
  heatingDiversityFactor: 0.75,
  wToKwh: 1000,
  kwhToGj: 0.0036,
};

export function ASHPReplacingFurnaceDSXCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentProjectId = localStorage.getItem("currentProjectId");

  const { data: project } = useQuery({
    queryKey: ["/api/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const form = useForm<ASHPCalculationInputs>({
    defaultValues: (project as any)?.ashpData || defaultValues,
    mode: "onChange"
  });

  const saveCalculation = useMutation({
    mutationFn: async (data: ASHPCalculationInputs) => {
      if (!currentProjectId) {
        throw new Error("No project selected");
      }
      
      const projectUpdateData = {
        ashpData: data
      };
      
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", projectUpdateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ASHP Data Saved",
        description: "Your ASHP calculation has been saved to the project.",
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
    const combinedData: ASHPCalculationData = {
      ...watchedValues,
      ...ashpConstants
    };
    return calculateASHPSavings(combinedData);
  }, [
    watchedValues.eflhHeating,
    watchedValues.eflhCooling,
    watchedValues.btuhcExist,
    watchedValues.seerExist,
    watchedValues.btuhcEE,
    watchedValues.btuhhExist,
    watchedValues.btuhhEE,
    watchedValues.furnanceEfficieny,
    watchedValues.annualNaturalGasUsage,
    watchedValues.annualHeatingEnergy
  ]);

  const overview = {
    technologyName: "Air Source Heat Pump Replacing Gas Furnace and DX Cooling ",
    category: "Space Heating & Cooling",
    lifetime: "16 years",
    baseCase: "Heating Equipment with HSPF 7.7 (COP~2.26) and Cooling Equipment with SEER 13.40",
    efficientCase: "ASHP with HSPF of 8.5 and SEER of 13.0",
    description: "Installation of a new residential sized Air Source Heat Pump system"
  };

  const calculationInputs = (
    <Form {...form}>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-blue-200">
            ASHP System Properties
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="eflhHeating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equivalent Full Load Hours - Heating</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Hours per year</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eflhCooling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equivalent Full Load Hours - Cooling</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Hours per year</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="btuhcExist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existing Cooling Capacity (BTU/h)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Cooling capacity of existing system</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seerExist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existing SEER Rating</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Seasonal Energy Efficiency Ratio</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="btuhcEE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Energy Efficient Cooling Capacity (BTU/h)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">ASHP cooling capacity</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ASHP SEER Rating</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.seerRR}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">ASHP Seasonal Energy Efficiency Ratio</p>
            </div>

            <FormField
              control={form.control}
              name="btuhhExist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existing Heating Capacity (BTU/h)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Existing furnace heating capacity</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="btuhhEE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ASHP Heating Capacity (BTU/h)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Heat pump heating capacity</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Existing HSPF Rating</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.hspfExist}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Heating Seasonal Performance Factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ASHP HSPF Rating</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.hspFee}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">ASHP Heating Seasonal Performance Factor</p>
            </div>

            <FormField
              control={form.control}
              name="furnanceEfficieny"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Furnace Efficiency</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">As decimal (0.80 for 80%)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="annualNaturalGasUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Natural Gas Usage (GJ)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Total annual gas consumption</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Furnace Usage Factor</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.furnanceUsageFactor}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Fraction of heating provided by ASHP</p>
            </div>

            <FormField
              control={form.control}
              name="annualHeatingEnergy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Heating Energy (GJ)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Total heating energy demand</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Factor</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.adjustmentFactor}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Performance adjustment factor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heating Diversity Factor</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.heatingDiversityFactor}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Load diversity adjustment</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Factors (Constants)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">W to kWh Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.wToKwh}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Watts to kilowatt-hours</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">kWh to GJ Conversion</label>
              <Input 
                type="number" 
                title="Constant"
                value={ashpConstants.kwhToGj}
                disabled
                className="bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">kilowatt-hours to gigajoules</p>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );

  const output = (
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
  );

  const headerActions = (
    <>
      <CommonValuesDialog 
        values={getCommonValues('ashp')} 
        title="Common Values for ASHP Calculations"
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
      title="ASHP Replacing Furnace DSX Technology"
      subtitle="Energy Efficiency Retrofit Calculator"
      icon={<Thermometer />}
      overview={overview}
      calculationInputs={calculationInputs}
      output={output}
      headerActions={headerActions}
    />
  );
}