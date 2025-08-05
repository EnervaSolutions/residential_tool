import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Home, Wind, Zap, Droplets, Thermometer, Snowflake, Sun, AlertTriangle, X, Fan } from "lucide-react";
import { useState, useEffect } from "react";
import { isSafari } from "@/lib/utils";
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
import ASHPReplacingFurnaceDSXPage from "@/pages/ashp-replacing-furnace-dsx";
import ASHPReplacingASHPPage from "./pages/ashp-replacing-ashp";
import FoundationInsulationPage from "@/pages/foundation-insulation";
import AudioRecordingPage from "@/pages/audio-recording";
import InstructionsPage from "@/pages/instructions";
import { FloatingRecorder } from "./components/floating-recorder";

function Sidebar() {
  const [location] = useLocation();
  const [showSafariBanner, setShowSafariBanner] = useState(false);

  useEffect(() => {
    // Check if Safari banner should be shown
    const isDismissed = localStorage.getItem('safari-banner-dismissed');
    if (isSafari() && !isDismissed) {
      setShowSafariBanner(true);
    }

    // Listen for banner dismissal
    const handleBannerDismissed = () => {
      setShowSafariBanner(false);
    };

    window.addEventListener('safari-banner-dismissed', handleBannerDismissed);
    return () => window.removeEventListener('safari-banner-dismissed', handleBannerDismissed);
  }, []);
  
  // Only show sidebar on calculator pages
  if (location === "/" || location === "/project-dashboard" || location === "/audio-recording" || location === "/instructions") {
    return null;
  }
  
  return (
    <div className={`w-64 bg-white border-r border-gray-200 fixed left-0 overflow-y-auto ${showSafariBanner ? "top-16 h-[calc(100vh-4rem)]" : "top-0 h-screen"}`}>
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
          <Link href="/ashp-replacing-furnace-dsx">
            <Button 
              variant={location === "/ashp-replacing-furnace-dsx" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              ASHP Replacing Furnace DSX
            </Button>
          </Link>
          <Link href="/ashp-replacing-ashp">
            <Button 
              variant={location === "/ashp-replacing-ashp" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Fan className="w-4 h-4 mr-2" />
              ASHP Replacing ASHP
            </Button>
          </Link>
          <Link href="/foundation-insulation">
            <Button 
              variant={location === "/foundation-insulation" ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-2" />
              Foundation Insulation
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const showSidebar = location !== "/" && location !== "/project-dashboard" && location !== "/audio-recording" && location !== "/instructions";
  const [showSafariBanner, setShowSafariBanner] = useState(false);

  useEffect(() => {
    // Check if Safari banner should be shown (same logic as SafariBanner component)
    const isDismissed = localStorage.getItem('safari-banner-dismissed');
    if (isSafari() && !isDismissed) {
      setShowSafariBanner(true);
    }

    // Listen for banner dismissal to update padding
    const handleBannerDismissed = () => {
      setShowSafariBanner(false);
    };

    window.addEventListener('safari-banner-dismissed', handleBannerDismissed);
    return () => window.removeEventListener('safari-banner-dismissed', handleBannerDismissed);
  }, []);
  
  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 ${showSidebar ? "ml-64" : ""} ${showSafariBanner ? "pt-16" : ""}`}>
        <Switch>
          <Route path="/" component={WelcomePage} />
          <Route path="/instructions" component={InstructionsPage} />
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
          <Route path="/ashp-replacing-furnace-dsx" component={ASHPReplacingFurnaceDSXPage} />
          <Route path="/ashp-replacing-ashp" component={ASHPReplacingASHPPage} />
          <Route path="/foundation-insulation" component={FoundationInsulationPage} />
          <Route path="/audio-recording" component={AudioRecordingPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function SafariBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user is on Safari and hasn't dismissed the banner
    const isDismissed = localStorage.getItem('safari-banner-dismissed');
    if (isSafari() && !isDismissed) {
      setShowBanner(true);
    }
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('safari-banner-dismissed', 'true');
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('safari-banner-dismissed'));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className="rounded-none border-x-0 border-t-0 bg-orange-50 border-orange-200">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800">
            For the best experience with audio recording and other features, we recommend using <strong>Google Chrome</strong> browser.
          </span>
          <Button
            onClick={dismissBanner}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SafariBanner />
        <Toaster />
        <FloatingRecorder position="top-left">
        <Router />
        </FloatingRecorder>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
