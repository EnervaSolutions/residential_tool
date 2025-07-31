import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator, CheckCircle, Info, Lightbulb, Zap, Wind, Droplets, Home, Sun, Snowflake, Thermometer, PlayCircle, FileText, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function InstructionsPage() {
  const [, setLocation] = useLocation();

  const calculatorFeatures = [
    { icon: Home, name: "Window Replacement", description: "Calculate energy savings from ENERGY STAR window replacements", color: "bg-blue-100 text-blue-600" },
    { icon: Home, name: "Door Replacement", description: "Analyze door replacement efficiency improvements", color: "bg-green-100 text-green-600" },
    { icon: Wind, name: "Air Sealing", description: "Estimate savings from building envelope air sealing", color: "bg-purple-100 text-purple-600" },
    { icon: Zap, name: "Attic Insulation", description: "Calculate thermal performance improvements", color: "bg-orange-100 text-orange-600" },
    { icon: Droplets, name: "Heat Recovery Systems", description: "DWHR systems for gas and electric water heaters", color: "bg-cyan-100 text-cyan-600" },
    { icon: Wind, name: "Heat Pump Water Heaters", description: "Efficiency calculations for HPWH systems", color: "bg-teal-100 text-teal-600" },
    { icon: Thermometer, name: "Smart Thermostats", description: "Automated temperature control savings", color: "bg-red-100 text-red-600" },
    { icon: Snowflake, name: "Heat Pump Systems", description: "Ground source and ductless mini-split calculations", color: "bg-indigo-100 text-indigo-600" },
    { icon: Sun, name: "Solar PV", description: "Photovoltaic system energy generation analysis", color: "bg-yellow-100 text-yellow-600" }
  ];

  const workflowSteps = [
    { number: 1, title: "Project Setup", description: "Create a new project or continue an existing one by entering client information and property details." },
    { number: 2, title: "Calculator Selection", description: "Choose from 17+ specialized energy efficiency calculators based on the retrofit technology." },
    { number: 3, title: "Data Input", description: "Enter property-specific measurements, equipment specifications, and baseline energy usage data." },
    { number: 4, title: "Analysis & Results", description: "Review calculated energy savings, cost analysis, and environmental impact metrics." },
    { number: 5, title: "Documentation", description: "Generate reports and save calculations for future reference and client presentations." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation("/")} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Instructions</h1>
                <p className="text-gray-600">Complete guide to using the Energy Efficiency Calculator Suite</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Quick Start Guide */}
        <section>
          <div className="flex items-center mb-6">
            <PlayCircle className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Start Guide</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map((step, index) => (
              <Card key={step.number} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="absolute -right-2 top-6 hidden md:block">
                        <div className="w-4 h-0.5 bg-blue-300"></div>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Available Calculators */}
        <section>
          <div className="flex items-center mb-6">
            <Calculator className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Available Calculators</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculatorFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Key Features */}
        <section>
          <div className="flex items-center mb-6">
            <Lightbulb className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle>Project Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Multi-Project Support</p>
                    <p className="text-sm text-gray-600">Create and manage multiple client projects simultaneously</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Auto-Save Functionality</p>
                    <p className="text-sm text-gray-600">All calculations and inputs are automatically saved</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Client Information Tracking</p>
                    <p className="text-sm text-gray-600">Store client details, property information, and project notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <CardTitle>Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Real-time Calculations</p>
                    <p className="text-sm text-gray-600">Instant energy savings and cost analysis as you input data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Technology Specifications</p>
                    <p className="text-sm text-gray-600">Built-in database of ENERGY STAR certified equipment</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Environmental Impact</p>
                    <p className="text-sm text-gray-600">CO₂ reduction and environmental benefit calculations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Getting Started Tips */}
        <section>
          <div className="flex items-center mb-6">
            <Info className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Getting Started Tips</h2>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Before You Begin</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Gather client property information (address, square footage, house type)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Collect baseline energy usage data (utility bills, equipment specifications)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Identify target retrofit technologies for analysis</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Have measurement tools ready for site-specific data</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Best Practices</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use Chrome browser for optimal audio recording functionality</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Save calculations frequently during long analysis sessions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Review all input parameters before finalizing calculations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use the audio recording feature to document site observations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Action Buttons */}
        <div className="text-center pt-8">
          <div className="space-x-4">
            <Button onClick={() => setLocation("/")} variant="outline" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              View Projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}