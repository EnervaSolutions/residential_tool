import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, TrendingUp, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect } from "react";

// Solar PV calculation input schema
const solarPvInputSchema = z.object({
  systemSize: z.number().min(0),
  arrayType: z.string().min(1),
  location: z.string().min(1),
  tilt: z.number().min(0).max(90),
  azimuth: z.number().min(0).max(360),
  losses: z.number().min(0).max(1),
  kwhToGjConversion: z.number().min(0),
  annualEnergyProductionKwh: z.number().min(0),
});

type SolarPvCalculationInputs = z.infer<typeof solarPvInputSchema>;

interface SolarPvCalculationResults {
  annualEnergyProductionGj: number;
}

export default function SolarPvCalculator() {
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

  const form = useForm<SolarPvCalculationInputs>({
    resolver: zodResolver(solarPvInputSchema),
    defaultValues: {
      systemSize: 1.0, // Fixed at 1 kW
      arrayType: "Fixed, Roof Mounted", // Most common install type
      location: "Calgary", // Default location
      tilt: 35, // Default tilt angle
      azimuth: 180, // South-facing (180 degrees)
      losses: 0.1408, // From PVWatts default
      kwhToGjConversion: 0.0036, // Conversion factor
      annualEnergyProductionKwh: 1086, // Static value from modeling
    },
  });

  // Load saved data when project loads
  useEffect(() => {
    if (project?.solarPvData) {
      const data = project.solarPvData as any;
      form.reset({
        systemSize: parseFloat(data.systemSize) || 1.0,
        arrayType: data.arrayType || "Fixed, Roof Mounted",
        location: data.location || "Calgary",
        tilt: parseFloat(data.tilt) || 35,
        azimuth: parseFloat(data.azimuth) || 180,
        losses: parseFloat(data.losses) || 0.1408,
        kwhToGjConversion: parseFloat(data.kwhToGjConversion) || 0.0036,
        annualEnergyProductionKwh: parseFloat(data.annualEnergyProductionKwh) || 1086,
      });
    }
  }, [project, form]);

  // Save to project mutation
  const saveToProject = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest(`/api/projects/${currentProjectId}`, "PATCH", {
        solarPvData: calculationData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId] });
      toast({
        title: "Calculation Saved",
        description: "Solar PV calculation saved to project successfully.",
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
  const calculateResults = (inputs: SolarPvCalculationInputs): SolarPvCalculationResults => {
    // Annual Energy Production (GJ/kW) = Annual_kWh_Production × kWh_to_GJ
    const annualEnergyProductionGj = inputs.annualEnergyProductionKwh * inputs.kwhToGjConversion;

    return {
      annualEnergyProductionGj: annualEnergyProductionGj,
    };
  };

  const results = calculateResults(watchedValues);

  const handleSaveToProject = () => {
    const calculationData = {
      ...watchedValues,
      annualEnergyProductionGj: results.annualEnergyProductionGj,
    };
    saveToProject.mutate(calculationData);
  };

  const locationOptions = [
    { value: "Lethbridge", label: "Lethbridge" },
    { value: "Calgary", label: "Calgary" },
    { value: "Edmonton", label: "Edmonton" },
    { value: "High Prairie", label: "High Prairie" },
  ];

  const tiltOptions = [
    { value: "0", label: "0° (Flat)" },
    { value: "20", label: "20°" },
    { value: "35", label: "35°" },
    { value: "51", label: "Latitude (≈51°)" }, // Approximate latitude for Alberta
  ];

  const azimuthOptions = [
    { value: "100", label: "100° (ESE)" },
    { value: "140", label: "140° (SE)" },
    { value: "180", label: "180° (South)" },
    { value: "220", label: "220° (SW)" },
    { value: "260", label: "260° (WSW)" },
  ];

  return (
    <div className="p-8">
      {/* Technology Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Sun className="text-primary text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Solar PV Technology</h1>
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
              <div className="bg-yellow-50 p-4 rounded-lg space-y-2 text-sm">
                <div><strong>Measure Name:</strong> Solar PV</div>
                <div><strong>Category:</strong> Solar PV</div>
                <div><strong>Expected Useful Life:</strong> 20 years</div>
                <div><strong>Source:</strong> Warranties can be provided for 20 years</div>
              </div>
              
              {/* Description */}
              <div className="space-y-3">
                <p className="text-gray-700"><strong>Description:</strong> Installing 1 kW of Solar PV</p>
                <p className="text-gray-700"><strong>Base Case:</strong> No existing solar PV</p>
                <p className="text-gray-700"><strong>Efficient Case:</strong> 1 kW of Solar PV installed</p>
                <p className="text-gray-700"><strong>Estimation Method:</strong> Energy Production (assumes all produced energy is consumed)</p>
                <p className="text-gray-700"><strong>Source:</strong> Solar production modelling (80 simulations across 4 Alberta cities)</p>
              </div>
            </CardContent>
          </Card>

          {/* Input Parameters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
                  <Sun className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Input Parameters</h2>
              </div>
              
              <Form {...form}>
                <div className="space-y-8">

                    {/* System Specifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="systemSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>System Size (kW)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Fixed capacity for the calculator</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="arrayType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type of Array</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  readOnly
                                  className="bg-gray-100"
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Most common install type</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Location and Orientation */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location and Orientation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude/Longitude</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {locationOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">Selection affects weather scenario</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tilt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tilt (degrees)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tilt" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {tiltOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="azimuth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Azimuth (degrees)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select azimuth" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {azimuthOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Constants and Production */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Constants and Production</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="losses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Losses (decimal)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.0001" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">From PVWatts default</p>
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
                              <p className="text-xs text-gray-500">Conversion factor</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="annualEnergyProductionKwh"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Energy Production (kWh/kW)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Average from 80 modelled scenarios</p>
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
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <TrendingUp className="text-yellow-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Output</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sun className="text-green-600 w-5 h-5" />
                    <span className="text-sm font-medium text-green-900">Annual Energy Production (GJ/kW)</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{results.annualEnergyProductionGj.toFixed(6)} GJ/kW</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}