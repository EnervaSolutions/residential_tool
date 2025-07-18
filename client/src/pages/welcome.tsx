import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Calculator, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { Project, InsertProject } from "@shared/schema";

const clientInfoSchema = z.object({
  clientFileNumber: z.string().min(1, "Client file number is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  houseType: z.string().min(1, "House type is required"),
  userInfo: z.string().optional(),
});

type ClientInfo = z.infer<typeof clientInfoSchema>;

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showProjectListDialog, setShowProjectListDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientInfo>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      clientFileNumber: "",
      streetAddress: "",
      houseType: "",
      userInfo: "",
    },
  });

  // Fetch existing projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: showProjectListDialog,
  });

  // Create new project mutation
  const createProject = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("/api/projects", "POST", data);
      return await response.json();
    },
    onSuccess: (project: Project) => {
      localStorage.setItem("currentProjectId", project.id.toString());
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      setShowNewProjectDialog(false);
      setLocation("/project-dashboard");
    },
    onError: (error: Error) => {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientInfo) => {
    createProject.mutate(data);
  };

  const handleContinueProject = (project: Project) => {
    localStorage.setItem("currentProjectId", project.id.toString());
    setLocation("/project-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Calculator className="text-primary text-4xl" />
            <h1 className="text-4xl font-bold text-gray-900">Energy Efficiency Retrofits Program</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive energy efficiency calculator featuring 13 technology calculators for residential retrofit projects
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start New Project */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowNewProjectDialog(true)}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Plus className="text-green-600 text-2xl" />
              </div>
              <CardTitle className="text-xl">Start New Project</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Begin a new energy efficiency calculation project by entering client information
              </p>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </CardContent>
          </Card>

          {/* Continue Saved Project */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowProjectListDialog(true)}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FolderOpen className="text-blue-600 text-2xl" />
              </div>
              <CardTitle className="text-xl">Continue Saved Project</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Load and continue working on a previously saved project
              </p>
              <Button variant="outline" className="w-full">
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Technology Features Overview */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Available Technology Calculators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <Calculator className="text-blue-500 text-xl mx-auto" />
              <h3 className="font-medium">Windows</h3>
              <p className="text-xs text-gray-600">ENERGY STAR® Replacement Windows</p>
            </div>
            <div className="text-center space-y-2">
              <FileText className="text-green-500 text-xl mx-auto" />
              <h3 className="font-medium">Doors</h3>
              <p className="text-xs text-gray-600">ENERGY STAR® Replacement Doors</p>
            </div>
            <div className="text-center space-y-2">
              <FolderOpen className="text-purple-500 text-xl mx-auto" />
              <h3 className="font-medium">Air Sealing</h3>
              <p className="text-xs text-gray-600">Improve home air tightness by 10%</p>
            </div>
            <div className="text-center space-y-2">
              <Plus className="text-orange-500 text-xl mx-auto" />
              <h3 className="font-medium">Attic Insulation</h3>
              <p className="text-xs text-gray-600">Increase insulation to R-55</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-indigo-500 text-xl mx-auto" />
              <h3 className="font-medium">DWHR - Gas</h3>
              <p className="text-xs text-gray-600">Drain Water Heat Recovery for Gas</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-cyan-500 text-xl mx-auto" />
              <h3 className="font-medium">DWHR - Electric</h3>
              <p className="text-xs text-gray-600">Drain Water Heat Recovery for Electric</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-red-500 text-xl mx-auto" />
              <h3 className="font-medium">Heat Pump WH - Gas</h3>
              <p className="text-xs text-gray-600">Heat Pump Water Heater replacing Gas</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-pink-500 text-xl mx-auto" />
              <h3 className="font-medium">Heat Pump WH - Electric</h3>
              <p className="text-xs text-gray-600">Heat Pump Water Heater replacing Electric</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-teal-500 text-xl mx-auto" />
              <h3 className="font-medium">Heat Recovery Ventilator</h3>
              <p className="text-xs text-gray-600">HVI Certified HRV with 75% efficiency</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-emerald-500 text-xl mx-auto" />
              <h3 className="font-medium">Smart Thermostat</h3>
              <p className="text-xs text-gray-600">ENERGY STAR® Smart Thermostat</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-amber-500 text-xl mx-auto" />
              <h3 className="font-medium">Ground Source Heat Pump</h3>
              <p className="text-xs text-gray-600">ENERGY STAR® GSHP with IGSHPA installer</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-violet-500 text-xl mx-auto" />
              <h3 className="font-medium">DMSHP</h3>
              <p className="text-xs text-gray-600">Ductless Mini-Split Heat Pump</p>
            </div>
            <div className="text-center space-y-2">
              <Calculator className="text-yellow-500 text-xl mx-auto" />
              <h3 className="font-medium">Solar PV</h3>
              <p className="text-xs text-gray-600">Solar Photovoltaic System (1 kW+)</p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              All calculators comply with Iowa Technical Reference Manual (TRM) specifications
            </p>
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientFileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client File Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter client file number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="houseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select house type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single-family">Single Family</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="condo">Condominium</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter complete street address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter contact information, notes, or additional details"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Continue"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Project List Dialog */}
      <Dialog open={showProjectListDialog} onOpenChange={setShowProjectListDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Project to Continue</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card key={project.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleContinueProject(project)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{project.clientFileNumber}</h3>
                          <p className="text-sm text-gray-600">{project.streetAddress}</p>
                          <p className="text-sm text-gray-500">{project.houseType}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Modified: {new Date(project.lastModified).toLocaleDateString()}</p>
                          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-600">No saved projects found</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setShowProjectListDialog(false);
                  setShowNewProjectDialog(true);
                }}>
                  Create New Project
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}