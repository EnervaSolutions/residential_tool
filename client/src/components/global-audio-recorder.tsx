// components/GlobalAudioRecorder.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Save, 
  Trash2, 
  Download,
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';
import { useGlobalRecordingStore } from '@/lib/globalRecordingStore';
import { useRecordingSave } from '@/hooks/useRecordingSave';

interface GlobalAudioRecorderProps {
  // Optional: if provided, will override localStorage project ID
  projectId?: number;
  // Compact mode for smaller UI spaces
  compact?: boolean;
}

export function GlobalAudioRecorder({ 
  projectId: propProjectId, 
  compact = false 
}: GlobalAudioRecorderProps) {
  const [recordingName, setRecordingName] = useState('');
  const [recordingDescription, setRecordingDescription] = useState('');
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

  // Get project ID from localStorage or use prop
  const getProjectId = (): number => {
    if (propProjectId) return propProjectId;
    
    try {
      const storedProjectId = localStorage.getItem('currentProjectId');
      return storedProjectId ? parseInt(storedProjectId, 10) : 1; // fallback to project 1
    } catch (error) {
      console.warn('Failed to get project ID from localStorage:', error);
      return 1;
    }
  };

  const currentProjectId = getProjectId();

  const {
    // State
    isRecording,
    isPaused,
    isInitialized,
    currentDuration,
    currentSession,
    hasRecoveredSessions,
    recoveredSessions,
    error,
    
    // Actions
    initialize,
    recoverSessions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveCurrentRecording,
    discardCurrentRecording,
    continueRecoveredSession,
    discardRecoveredSession,
    cleanupAfterSave,
    clearError,
  } = useGlobalRecordingStore();

  // Hook for saving to server
  const { saveRecording: saveToServer, isLoading: isSavingToServer } = useRecordingSave({
    projectId: currentProjectId,
    onSuccess: async () => {
      // Clean up IndexedDB after successful server save
      if (currentSession) {
        await cleanupAfterSave(currentSession.sessionId);
      }
      
      setRecordingName('');
      setRecordingDescription('');
      setSavedBlob(null);
    },
  });

  // Initialize on mount
  useEffect(() => {
    const initializeStore = async () => {
      if (!isInitialized) {
        await initialize();
        await recoverSessions();
      }
    };
    initializeStore();
  }, [initialize, recoverSessions, isInitialized]);

  const handleStartRecording = async () => {
    try {
      await startRecording(currentProjectId);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleSaveRecording = async () => {
    if (!recordingName.trim()) {
      return;
    }

    try {
      // Save current recording to blob first
      const blob = await saveCurrentRecording(recordingName, recordingDescription);
      setSavedBlob(blob);

      // Then save to server
      await saveToServer({
        audioBlob: blob,
        name: recordingName,
        description: recordingDescription,
        duration: currentDuration,
        mimeType: currentSession?.mimeType || 'audio/webm',
      });
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  const handleDiscardRecording = () => {
    discardCurrentRecording();
    setRecordingName('');
    setRecordingDescription('');
    setSavedBlob(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isInitialized) {
    return (
      <Card className={compact ? "w-full max-w-sm" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Button onClick={initialize} variant="outline" size={compact ? "sm" : "default"}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Initialize Audio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Recovery Alert - Compact */}
        {hasRecoveredSessions && (
          <Alert className="p-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <div className="flex items-center gap-1">
                <span>{recoveredSessions.length} incomplete recording(s)</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => continueRecoveredSession(recoveredSessions[0].sessionId)}
                  className="text-xs h-5 px-1"
                >
                  Continue
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Recording Controls */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                P{currentProjectId}
              </Badge>
              
              {!isRecording ? (
                <Button 
                  onClick={handleStartRecording} 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Mic className="h-3 w-3" />
                  Record
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleStopRecording} 
                    variant="destructive" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <MicOff className="h-3 w-3" />
                    Stop ({formatDuration(currentDuration)})
                  </Button>
                  {!isPaused ? (
                    <Button onClick={pauseRecording} variant="outline" size="sm">
                      <Pause className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button onClick={resumeRecording} variant="outline" size="sm">
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Save Form - Compact */}
            {currentSession && !isRecording && (
              <div className="mt-2 space-y-2">
                <Input
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder="Recording name"
                  className="text-xs h-7"
                />
                <div className="flex gap-1">
                  <Button 
                    onClick={handleSaveRecording} 
                    disabled={isSavingToServer || !recordingName.trim()}
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    {isSavingToServer ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleDiscardRecording} variant="outline" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full UI (non-compact)
  return (
    <div className="space-y-4">
      {/* Recovery Alert */}
      {hasRecoveredSessions && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Found {recoveredSessions.length} incomplete recording(s) from a previous session:</p>
              <div className="flex flex-wrap gap-2">
                {recoveredSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Project {session.projectId} • {Math.floor((session.lastChunkTime - session.startTime) / 1000)}s
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => continueRecoveredSession(session.sessionId)}
                      className="text-xs h-6 px-2"
                    >
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => discardRecoveredSession(session.sessionId)}
                      className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                    >
                      Discard
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button size="sm" variant="outline" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Recorder
            <Badge variant="outline" className="text-xs">
              Project {currentProjectId}
            </Badge>
            {currentSession && (
              <Badge variant="secondary" className="text-xs">
                {currentSession.mimeType}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button 
                onClick={handleStartRecording} 
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-2">
                  <MicOff className="h-4 w-4" />
                  Stop Recording ({formatDuration(currentDuration)})
                </Button>
                {!isPaused ? (
                  <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeRecording} variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Current Recording Status */}
          {currentSession && !isRecording && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Recording ready to save: {formatDuration(currentDuration)} 
                {currentSession.name && ` • ${currentSession.name}`}
              </p>
            </div>
          )}

          {/* Save Recording Form */}
          {currentSession && !isRecording && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordingName">Recording Name *</Label>
                  <Input
                    id="recordingName"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Enter recording name"
                  />
                </div>
                <div>
                  <Label htmlFor="recordingDescription">Description</Label>
                  <Input
                    id="recordingDescription"
                    value={recordingDescription}
                    onChange={(e) => setRecordingDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveRecording} 
                  disabled={isSavingToServer || !recordingName.trim()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSavingToServer ? "Saving..." : "Save Recording"}
                </Button>
                <Button 
                  onClick={handleDiscardRecording} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}