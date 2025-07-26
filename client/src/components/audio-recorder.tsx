// components/AudioRecorder.tsx (Updated with Global Recording)
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Save,
  RefreshCw,
  AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalRecordingStore } from "@/lib/globalRecordingStore";
import { useRecordingSave } from "@/hooks/useRecordingSave";
import type { AudioRecording } from "@shared/schema";

interface AudioRecorderProps {
  projectId: number;
}

export function AudioRecorder({ projectId }: AudioRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get project ID from localStorage or fallback to prop
  const getProjectId = (): number => {
    try {
      const storedProjectId = localStorage.getItem('currentProjectId');
      return storedProjectId ? parseInt(storedProjectId, 10) : projectId;
    } catch (error) {
      console.warn('Failed to get project ID from localStorage:', error);
      return projectId;
    }
  };

  const currentProjectId = getProjectId();

  // Global recording store
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
    startRecording: startGlobalRecording,
    stopRecording: stopGlobalRecording,
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

  // Fetch existing recordings
  const { data: recordings = [], isLoading } = useQuery<AudioRecording[]>({
    queryKey: ["/api/projects", currentProjectId, "audio"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${currentProjectId}/audio`);
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      return response.json();
    },
  });

  // Delete recording mutation
  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/audio/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProjectId, "audio"] });
      toast({ title: "Recording deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete recording", variant: "destructive" });
    },
  });

  const startRecording = async () => {
    try {
      await startGlobalRecording(currentProjectId);
      toast({ title: "Recording started" });
    } catch (error) {
      toast({
        title: "Failed to start recording",
        description: "Please check microphone permissions",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    try {
      await stopGlobalRecording();
      toast({ title: "Recording stopped" });
    } catch (error) {
      toast({
        title: "Failed to stop recording",
        variant: "destructive"
      });
    }
  };

  const playRecording = () => {
    if (savedBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(savedBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    discardCurrentRecording();
    setIsPlaying(false);
    setRecordingName("");
    setRecordingDescription("");
    setSavedBlob(null);
  };

  // Save current recording using global store
  const handleSaveRecording = async () => {
    if (!recordingName.trim()) {
      toast({
        title: "Recording name required",
        description: "Please provide a name for the recording",
        variant: "destructive"
      });
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

  const downloadRecording = (recording: AudioRecording) => {
    const audioData = `data:${recording.mimeType};base64,${recording.audioData}`;
    const link = document.createElement('a');
    link.href = audioData;
    const extension = getFileExtension(recording.mimeType);
    link.download = `${recording.name}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileExtension = (mimeType: string): string => {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };
    for (const [type, ext] of Object.entries(extensions)) {
      if (mimeType.includes(type)) return ext;
    }
    return 'wav';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [savedBlob]);

  useEffect(() => {
    if (error) {
      toast({ title: "Recording Error", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  return (
    <div className="space-y-6">
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
                onClick={startRecording} 
                disabled={!isInitialized}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
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

            {savedBlob && (
              <>
                {!isPlaying ? (
                  <Button onClick={playRecording} variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Play
                  </Button>
                ) : (
                  <Button onClick={pausePlayback} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={resetRecording} variant="outline" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </>
            )}

            {!isInitialized && (
              <Button onClick={initialize} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Initialize
              </Button>
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
                  onClick={resetRecording} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard
                </Button>
              </div>
            </div>
          )}

          {/* Hidden audio element for playback */}
          <audio ref={audioRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>

      {/* Saved Recordings */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading recordings...</p>
          ) : recordings.length === 0 ? (
            <p className="text-muted-foreground">No recordings saved yet.</p>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording: AudioRecording) => (
                <div key={recording.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{recording.name}</h3>
                      {recording.description && (
                        <p className="text-sm text-muted-foreground mt-1">{recording.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>Duration: {formatDuration(recording.duration || 0)}</p>
                        <p>Saved: {formatDateTime(recording.createdAt.toString())}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => downloadRecording(recording)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button
                        onClick={() => deleteRecordingMutation.mutate(recording.id)}
                        variant="outline"
                        size="sm"
                        disabled={deleteRecordingMutation.isPending}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}