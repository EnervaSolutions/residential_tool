import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioRecorder } from "@/components/audio-recorder";
import { ArrowLeft } from "lucide-react";

export default function AudioRecording() {
  const [, setLocation] = useLocation();
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  useEffect(() => {
    const projectId = localStorage.getItem("currentProjectId");
    if (!projectId) {
      setLocation("/");
      return;
    }
    setCurrentProjectId(parseInt(projectId));
  }, [setLocation]);

  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Audio Recordings</CardTitle>
                <p className="text-gray-600 mt-2">Record and manage conversations for this project</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setLocation("/project-dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Audio Recorder Component */}
        <AudioRecorder projectId={currentProjectId} />
      </div>
    </div>
  );
}