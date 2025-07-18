import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommonValue {
  category: string;
  variable: string;
  value: string | number;
  unit: string;
  additionalInfo: string;
}

interface CommonValuesDialogProps {
  values: CommonValue[];
  title?: string;
}

export function CommonValuesDialog({ values, title = "Common Values" }: CommonValuesDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (value: string | number) => {
    navigator.clipboard.writeText(value.toString());
    toast({
      title: "Copied",
      description: `Value ${value} copied to clipboard`,
    });
  };

  const groupedValues = values.reduce((acc, value) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push(value);
    return acc;
  }, {} as Record<string, CommonValue[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="w-4 h-4 mr-2" />
          Common Values
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="common-values-description">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="common-values-description">
            Reference values commonly used in energy efficiency calculations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedValues).map(([category, categoryValues]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                {category}
              </h3>
              <div className="grid gap-3">
                {categoryValues.map((item, index) => (
                  <Card key={index} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">{item.variable}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.value} {item.unit}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(item.value)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          {item.additionalInfo && (
                            <p className="text-sm text-gray-600">{item.additionalInfo}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}