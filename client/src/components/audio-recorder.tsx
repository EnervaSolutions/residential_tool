import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Play, Pause, Download, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AudioRecording, InsertAudioRecording } from "@shared/schema";

interface AudioRecorderProps {
  projectId: number;
}

export function AudioRecorder({ projectId }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const saveRecordingMutation = useMutation({
    mutationFn: async (data: Omit<InsertAudioRecording, "projectId">) => {
      const response = await fetch(`/api/projects/${projectId}/audio`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({ title: "Recording started" });
    } catch (error) {
      toast({ title: "Failed to start recording", description: "Please check microphone permissions", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({ title: "Recording stopped" });
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
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
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingName("");
    setRecordingDescription("");
    setDuration(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const saveRecording = async () => {
    if (!audioBlob || !recordingName.trim()) {
      toast({ title: "Please provide a name for the recording", variant: "destructive" });
      return;
    }

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const audioData = base64Data.split(',')[1]; // Remove data:audio/wav;base64, prefix

      saveRecordingMutation.mutate({
        name: recordingName.trim(),
        description: recordingDescription.trim() || undefined,
        audioData,
        duration,
        mimeType: audioBlob.type || "audio/wav",
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  const downloadRecording = (recording: AudioRecording) => {
    const audioData = `data:${recording.mimeType};base64,${recording.audioData}`;
    const link = document.createElement('a');
    link.href = audioData;
    link.download = `${recording.name}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Recorder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                <MicOff className="h-4 w-4" />
                Stop Recording ({formatDuration(duration)})
              </Button>
            )}

            {audioUrl && (
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
          {audioBlob && (
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
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
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
                        <p>Saved: {formatDateTime(recording.createdAt)}</p>
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