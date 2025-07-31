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
import { FolderOpen, Plus, Calculator, FileText, Info } from "lucide-react";
import { useLocation } from "wouter";
import { Project, InsertProject } from "@shared/schema";
import { useProjectSwitch } from "@/hooks/useProjectSwitch";
import { RecordingSavePrompt } from "@/components/recording-save-prompt";

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

  const projectSwitch = useProjectSwitch({
    onSwitch: () => setLocation("/project-dashboard"),
    onBlocked: (reason) => toast({
      title: "Cannot Switch Projects",
      description: reason,
      variant: "destructive",
    })
  });

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
      projectSwitch.switchProject(project.id, true); // Force switch for new projects
      toast({
        title: "Project Created",
        description: "Your new project has been created successfully.",
      });
      setShowNewProjectDialog(false);
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
    projectSwitch.switchProject(project.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-full shadow-xl">
              <Calculator className="text-white text-5xl" />
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Energy Efficiency Retrofits
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700">
                Professional Calculator Suite
              </h2>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive energy efficiency calculator suite featuring advanced technology calculators 
            for residential retrofit projects and energy savings analysis
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start New Project */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => setShowNewProjectDialog(true)}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Plus className="text-green-600 text-2xl" />
              </div>
              <CardTitle className="text-xl">Start New Project</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex-1 flex flex-col">
              <p className="text-gray-600 mb-4 flex-1">
                Begin a new energy efficiency calculation project by entering client information
              </p>
              <Button className="w-full mt-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </CardContent>
          </Card>

          {/* Continue Saved Project */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => setShowProjectListDialog(true)}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FolderOpen className="text-blue-600 text-2xl" />
              </div>
              <CardTitle className="text-xl">Continue Saved Project</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex-1 flex flex-col">
              <p className="text-gray-600 mb-4 flex-1">
                Load and continue working on a previously saved project
              </p>
              <Button variant="outline" className="w-full mt-auto">
                <FolderOpen className="w-4 h-4 mr-2" />
                Load Project
              </Button>
            </CardContent>
          </Card>

          {/* Instructions & Help */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full" onClick={() => setLocation("/instructions")}>
            <CardHeader className="text-center">
              <div className="mx-auto bg-indigo-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Info className="text-indigo-600 text-2xl" />
              </div>
              <CardTitle className="text-xl">User Guide & Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex-1 flex flex-col">
              <p className="text-gray-600 mb-4 flex-1">
                View comprehensive instructions and calculator documentation
              </p>
              <Button variant="outline" className="w-full mt-auto">
                <Info className="w-4 h-4 mr-2" />
                View Instructions
              </Button>
            </CardContent>
          </Card>
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

      {/* Recording Save Prompt */}
      <RecordingSavePrompt
        isOpen={projectSwitch.isPrompting}
        onSave={projectSwitch.saveAndSwitch}
        onDiscard={projectSwitch.discardAndSwitch}
        onCancel={projectSwitch.cancelSwitch}
        isSaving={projectSwitch.isSaving}
        duration={projectSwitch.currentDuration}
        projectId={projectSwitch.pendingProjectId}
      />
    </div>
  );
}