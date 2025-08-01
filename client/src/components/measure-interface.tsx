import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calculator } from "lucide-react";

interface MeasureOverviewProps {
  technologyName: string;
  category: string;
  lifetime: string;
  baseCase: string;
  efficientCase: string;
  description: string;
  icon?: ReactNode;
}

interface MeasureInterfaceProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  overview: MeasureOverviewProps;
  calculationInputs: ReactNode;
  output: ReactNode;
  headerActions?: ReactNode;
}

export function MeasureInterface({
  title,
  subtitle,
  icon,
  overview,
  calculationInputs,
  output,
  headerActions
}: MeasureInterfaceProps) {
  return (
    <div className="p-8">
      {/* Technology Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {icon && <div className="text-blue-600 text-3xl">{icon}</div>}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-lg text-gray-600">{subtitle}</p>
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Measure Overview */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  {overview.icon || <TrendingUp className="text-white text-xl" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Measure Overview</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technology Name</label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-900 font-medium">{overview.technologyName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-600">{overview.category}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lifetime</label>
                    <div className="p-3 bg-gray-50 rounded-md text-gray-600">{overview.lifetime}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Case</label>
                    <div className="p-3 bg-red-50 rounded-md text-gray-600 text-sm">{overview.baseCase}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Efficient Case</label>
                    <div className="p-3 bg-green-50 rounded-md text-gray-600 text-sm">{overview.efficientCase}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Measure Description</h4>
                <p className="text-sm text-gray-700">{overview.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Inputs */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <Calculator className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Calculation Inputs</h2>
              </div>
              {calculationInputs}
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="text-green-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Output</h3>
              </div>
              {output}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}