import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash2, Clock } from 'lucide-react';

interface RecordingSavePromptProps {
  isOpen: boolean;
  onSave: (name: string, description?: string) => Promise<void>;
  onDiscard: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  duration: number;
  projectId: number | null;
}

export function RecordingSavePrompt({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isSaving,
  duration,
  projectId,
}: RecordingSavePromptProps) {
  const [recordingName, setRecordingName] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!recordingName.trim()) return;
    
    try {
      await onSave(recordingName, recordingDescription);
      setRecordingName('');
      setRecordingDescription('');
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  const handleDiscard = async () => {
    try {
      await onDiscard();
      setRecordingName('');
      setRecordingDescription('');
    } catch (error) {
      console.error('Failed to discard recording:', error);
    }
  };

  const handleCancel = () => {
    onCancel();
    setRecordingName('');
    setRecordingDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Recording Before Switching Projects
          </DialogTitle>
          <DialogDescription>
            You have an unsaved recording from Project {projectId}. Would you like to save it before switching to a different project?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Duration: {formatDuration(duration)}
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="recordingName">Recording Name *</Label>
              <Input
                id="recordingName"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                placeholder="Enter recording name"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="recordingDescription">Description (Optional)</Label>
              <Textarea
                id="recordingDescription"
                value={recordingDescription}
                onChange={(e) => setRecordingDescription(e.target.value)}
                placeholder="Add description or notes..."
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDiscard}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Discard & Switch
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !recordingName.trim()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save & Switch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}