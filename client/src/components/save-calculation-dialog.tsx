import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface SaveCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, notes?: string) => void;
  isLoading: boolean;
}

export function SaveCalculationDialog({ open, onOpenChange, onSave, isLoading }: SaveCalculationDialogProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), notes.trim() || undefined);
    setName("");
    setNotes("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setName("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="text-primary w-5 h-5" />
            <span>Save Calculation</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="calcName">Calculation Name</Label>
            <Input
              id="calcName"
              placeholder="e.g., Window Replacement - Project A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="calcNotes">Notes (Optional)</Label>
            <Textarea
              id="calcNotes"
              placeholder="Add any additional notes about this calculation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
