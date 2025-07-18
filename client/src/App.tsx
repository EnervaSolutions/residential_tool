import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calculator, Home, Wind, Zap, Droplets, Thermometer, Snowflake, Sun } from "lucide-react";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome";
import ProjectDashboard from "@/pages/project-dashboard";
import WindowCalculator from "@/pages/calculator";
import DoorCalculator from "@/pages/door-calculator";
import AirSealingCalculator from "@/pages/air-sealing-calculator";
import AtticInsulationPage from "@/pages/attic-insulation";
import DwhrGasPage from "@/pages/dwhr-gas";
import DwhrElectricPage from "@/pages/dwhr-electric";
import HeatPumpWaterHeaterPage from "@/pages/heat-pump-water-heater";
import HeatPumpWaterHeaterElectricPage from "@/pages/heat-pump-water-heater-electric";
import HeatRecoveryVentilatorPage from "@/pages/heat-recovery-ventilator";
import SmartThermostatPage from "@/pages/smart-thermostat";
import GroundSourceHeatPumpPage from "@/pages/ground-source-heat-pump";
import DmshpPage from "@/pages/dmshp";
import SolarPvPage from "@/pages/solar-pv";
import AudioRecordingPage from "@/pages/audio-recording";

function Sidebar() {
  const [location] = useLocation();
  
  // Only show sidebar on calculator pages
  if (location === "/" || location === "/project-dashboard" || location === "/audio-recording") {
    return null;
  }
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Calculator className="text-primary text-2xl mr-3" />
          <span className="text-xl font-bold text-gray-900">Energy Calculator</span>
        </div>
        
        <nav className="space-y-2">
          <Link href="/project-dashboard">
            <Button 
              variant="outline"
              className="w-full justify-start mb-4"
            >
              <Home className="w-4 h-4 mr-2" />
              Project Dashboard
            </Button>
          </Link>
          
          <Link href="/windows">
            <Button 
              variant={location === "/windows" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Window Replacement
            </Button>
          </Link>
          <Link href="/doors">
            <Button 
              variant={location === "/doors" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Door Replacement
            </Button>
          </Link>
          <Link href="/air-sealing">
            <Button 
              variant={location === "/air-sealing" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Wind className="w-4 h-4 mr-2" />
              Air Sealing
            </Button>
          </Link>
          <Link href="/attic-insulation">
            <Button 
              variant={location === "/attic-insulation" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Zap className="w-4 h-4 mr-2" />
              Attic Insulation
            </Button>
          </Link>
          <Link href="/dwhr-gas">
            <Button 
              variant={location === "/dwhr-gas" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Droplets className="w-4 h-4 mr-2" />
              DWHR - Gas
            </Button>
          </Link>
          <Link href="/dwhr-electric">
            <Button 
              variant={location === "/dwhr-electric" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Zap className="w-4 h-4 mr-2" />
              DWHR - Electric
            </Button>
          </Link>
          <Link href="/heat-pump-water-heater">
            <Button 
              variant={location === "/heat-pump-water-heater" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Wind className="w-4 h-4 mr-2" />
              Heat Pump WH - Gas
            </Button>
          </Link>
          <Link href="/heat-pump-water-heater-electric">
            <Button 
              variant={location === "/heat-pump-water-heater-electric" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Zap className="w-4 h-4 mr-2" />
              Heat Pump WH - Electric
            </Button>
          </Link>
          <Link href="/heat-recovery-ventilator">
            <Button 
              variant={location === "/heat-recovery-ventilator" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Wind className="w-4 h-4 mr-2" />
              Heat Recovery Ventilator
            </Button>
          </Link>
          <Link href="/smart-thermostat">
            <Button 
              variant={location === "/smart-thermostat" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Smart Thermostat
            </Button>
          </Link>
          <Link href="/ground-source-heat-pump">
            <Button 
              variant={location === "/ground-source-heat-pump" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Zap className="w-4 h-4 mr-2" />
              Ground Source Heat Pump
            </Button>
          </Link>
          <Link href="/dmshp">
            <Button 
              variant={location === "/dmshp" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Snowflake className="w-4 h-4 mr-2" />
              DMSHP
            </Button>
          </Link>
          <Link href="/solar-pv">
            <Button 
              variant={location === "/solar-pv" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Sun className="w-4 h-4 mr-2" />
              Solar PV
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const showSidebar = location !== "/" && location !== "/project-dashboard" && location !== "/audio-recording";
  
  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 ${showSidebar ? "ml-64" : ""}`}>
        <Switch>
          <Route path="/" component={WelcomePage} />
          <Route path="/project-dashboard" component={ProjectDashboard} />
          <Route path="/windows" component={WindowCalculator} />
          <Route path="/doors" component={DoorCalculator} />
          <Route path="/air-sealing" component={AirSealingCalculator} />
          <Route path="/attic-insulation" component={AtticInsulationPage} />
          <Route path="/dwhr-gas" component={DwhrGasPage} />
          <Route path="/dwhr-electric" component={DwhrElectricPage} />
          <Route path="/heat-pump-water-heater" component={HeatPumpWaterHeaterPage} />
          <Route path="/heat-pump-water-heater-electric" component={HeatPumpWaterHeaterElectricPage} />
          <Route path="/heat-recovery-ventilator" component={HeatRecoveryVentilatorPage} />
          <Route path="/smart-thermostat" component={SmartThermostatPage} />
          <Route path="/ground-source-heat-pump" component={GroundSourceHeatPumpPage} />
          <Route path="/dmshp" component={DmshpPage} />
          <Route path="/solar-pv" component={SolarPvPage} />
          <Route path="/audio-recording" component={AudioRecordingPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
