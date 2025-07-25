import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Play, Pause, Download, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUniversalAudioRecorder } from "./universalRecorder"; // Import the hook
import type { AudioRecording, InsertAudioRecording } from "@shared/schema";
import BrowserOptimizationBanner from "./browser-banner";
interface AudioRecorderProps {
  projectId: number;
}

export function AudioRecorder({ projectId }: AudioRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Voice-optimized recording (default)
  const recorder = useUniversalAudioRecorder({
  voiceOptimized: true,  // 32 kbps, 16 kHz, mono
  maxDurationMs: 2 * 60 * 60 * 1000, // 2 hours max
  });

  // Fetch existing recordings
  const { data: recordings = [], isLoading } = useQuery<AudioRecording[]>({
    queryKey: ["/api/projects", projectId, "audio"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/audio`);
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }
      return response.json();
    },
  });

  // Save recording mutation
  // const saveRecordingMutation = useMutation({
  //   mutationFn: async (data: Omit<InsertAudioRecording, "projectId">) => {
  //     const response = await fetch(`/api/projects/${projectId}/audio`, {
  //       method: "POST",
  //       body: JSON.stringify(data),
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to save recording');
  //     }
  //     return response.json();
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "audio"] });
  //     toast({ title: "Recording saved successfully" });
  //     resetRecording();
  //   },
  //   onError: () => {
  //     toast({ title: "Failed to save recording", variant: "destructive" });
  //   },
  // });

  const saveRecordingMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/projects/${projectId}/audio`, {
        method: "POST",
        body: formData, // Send FormData directly
        // Remove Content-Type header - browser sets it automatically with boundary
      });
      if (!response.ok) {
        throw new Error('Failed to save recording');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "audio"] });
      toast({ title: "Recording saved successfully" });
      resetRecording();
    },
    onError: () => {
      toast({ title: "Failed to save recording", variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "audio"] });
      toast({ title: "Recording deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete recording", variant: "destructive" });
    },
  });

  const startRecording = async () => {
    try {
      await recorder.startRecording();
      toast({ title: "Recording started" });
    } catch (error) {
      toast({
        title: "Failed to start recording",
        description: "Please check microphone permissions",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    recorder.stopRecording();
    toast({ title: "Recording stopped" });
  };

  const playRecording = () => {
    if (recorder.audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    recorder.resetRecording();
    setIsPlaying(false);
    setRecordingName("");
    setRecordingDescription("");
  };

  // const saveRecording = async () => {
  //   if (!recorder.audioBlob || !recordingName.trim()) {
  //     toast({ title: "Please provide a name for the recording", variant: "destructive" });
  //     return;
  //   }

  //   if (recorder.audioBlob.size === 0) {
  //     toast({ title: "Invalid audio recording", variant: "destructive" });
  //     return;
  //   }

  //   if (recorder.audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
  //     toast({ title: "Audio file too large", variant: "destructive" });
  //     return;
  //   }

  //   try {
  //     // Convert blob to base64 with proper error handling
  //     const base64Data = await new Promise<string>((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => resolve(reader.result as string);
  //       reader.onerror = () => reject(new Error('Failed to read audio file'));
  //       reader.readAsDataURL(recorder.audioBlob!);
  //     });

  //     const audioData = base64Data.split(',')[1];

  //     saveRecordingMutation.mutate({
  //       name: recordingName.trim(),
  //       description: recordingDescription.trim() || undefined,
  //       audioData,
  //       duration: recorder.duration,
  //       mimeType: recorder.mimeType, // Use actual MIME type from recorder
  //     });
  //   } catch (error) {
  //     toast({ title: "Failed to process audio file", variant: "destructive" });
  //   }
  // };

  const saveRecording = async () => {
    if (!recorder.audioBlob || !recordingName.trim()) {
      toast({ title: "Please provide a name for the recording", variant: "destructive" });
      return;
    }
  
    if (recorder.audioBlob.size === 0) {
      toast({ title: "Invalid audio recording", variant: "destructive" });
      return;
    }
  
    if (recorder.audioBlob.size > 50 * 1024 * 1024) { // 50MB limit
      toast({ title: "Audio file too large", variant: "destructive" });
      return;
    }
  
    try {
      const formData = new FormData();
      // Determine file extension based on MIME type
      const fileExtension = recorder.mimeType.includes('webm') ? '.webm' : 
        recorder.mimeType.includes('mp4') ? '.mp4' : '.webm';
      formData.append('audio', recorder.audioBlob, `${recordingName.trim()}${fileExtension}`);
      formData.append('name', recordingName.trim());
      formData.append('duration', recorder.duration.toString());
      formData.append('mimeType', recorder.mimeType);
      
      if (recordingDescription.trim()) {
        formData.append('description', recordingDescription.trim());
      }
  
      // Update your mutation to handle FormData instead of JSON
      saveRecordingMutation.mutate(formData);
    } catch (error) {
      toast({ title: "Failed to process audio file", variant: "destructive" });
    }
  };
  const downloadRecording = (recording: AudioRecording) => {
    const audioData = `data:${recording.mimeType};base64,${recording.audioData}`;
    const link = document.createElement('a');
    link.href = audioData;
    // Use proper file extension based on MIME type
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
    return 'wav'; // fallback
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
  }, [recorder.audioUrl]);

  // Show recorder error if any
  useEffect(() => {
    if (recorder.error) {
      toast({ title: "Recording Error", description: recorder.error, variant: "destructive" });
    }
  }, [recorder.error, toast]);

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <BrowserOptimizationBanner />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Recorder
            <span className="text-sm text-muted-foreground ml-2">
              (Format: {recorder.mimeType || 'Not selected'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!recorder.isRecording ? (
              <Button onClick={startRecording} className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                  <MicOff className="h-4 w-4" />
                  Stop Recording ({formatDuration(recorder.duration)})
                </Button>
                {!recorder.isPaused ? (
                  <Button onClick={recorder.pauseRecording} variant="outline" className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={recorder.resumeRecording} variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                )}
              </>
            )}

            {recorder.audioUrl && (
              <>
                {!isPlaying ? (
                  <Button onClick={playRecording} variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Play
                  </Button>
                ) : (
                  <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
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
          </div>

          {/* Save Recording Form */}
          {recorder.audioBlob && (
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
              <Button 
                onClick={saveRecording} 
                disabled={saveRecordingMutation.isPending || !recordingName.trim()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveRecordingMutation.isPending ? "Saving..." : "Save Recording"}
              </Button>
            </div>
          )}

          {/* Hidden audio element for playback */}
          {recorder.audioUrl && (
            <audio ref={audioRef} src={recorder.audioUrl} style={{ display: 'none' }} />
          )}
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