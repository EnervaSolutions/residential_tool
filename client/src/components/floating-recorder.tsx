import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Save, 
  Trash2,
  Minimize2,
  Maximize2,
  X,
  AlertTriangle
} from 'lucide-react';
import { useGlobalRecordingStore } from '@/lib/globalRecordingStore';
import { useRecordingSave } from '@/hooks/useRecordingSave';

interface FloatingRecorderProps {
  // Position on screen
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoHide?: boolean;
  children?: React.ReactNode;
}

export function FloatingRecorder({ 
  position = 'bottom-right',
  autoHide = false,
  children
}: FloatingRecorderProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [recordingName, setRecordingName] = useState('');

  // Get project ID from localStorage
  const getProjectId = (): number | null => {
    try {
      const storedProjectId = localStorage.getItem('currentProjectId');
      return storedProjectId ? parseInt(storedProjectId, 10) : null;
    } catch (error) {
      return null;
    }
  };

  const currentProjectId = getProjectId();

  const {
    isRecording,
    isPaused,
    isInitialized,
    currentDuration,
    currentSession,
    hasRecoveredSessions,
    recoveredSessions,
    error,
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
  } = useGlobalRecordingStore();

  const { saveRecording: saveToServer, isLoading: isSavingToServer } = useRecordingSave({
    projectId: currentProjectId || 1,
    onSuccess: async () => {
      if (currentSession) {
        await cleanupAfterSave(currentSession.sessionId);
      }
      setRecordingName('');
    },
  });

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (!isInitialized) {
        await initialize();
        await recoverSessions();
      }
    };
    init();
  }, [initialize, recoverSessions, isInitialized]);

  // Auto-hide logic (also show when there are recovered sessions)
  useEffect(() => {
    if (autoHide && !isRecording && !currentSession && !hasRecoveredSessions) {
      setIsVisible(false);
    } else if (isRecording || currentSession || hasRecoveredSessions) {
      setIsVisible(true);
    }
  }, [autoHide, isRecording, currentSession, hasRecoveredSessions]);

  // Don't render the floating recorder if there's no project ID
  if (!currentProjectId || currentProjectId === 0) {
    return <>{children}</>;
  }

  const handleStartRecording = async () => {
    try {
      await startRecording(currentProjectId);
      setIsVisible(true);
      setIsMinimized(false);
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
    if (!recordingName.trim()) return;

    try {
      const blob = await saveCurrentRecording(recordingName, '');
      await saveToServer({
        audioBlob: blob,
        name: recordingName,
        description: '',
        duration: currentDuration,
        mimeType: currentSession?.mimeType || 'audio/webm',
      });
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-5 right-4`;
      case 'top-left':
        return `${baseClasses} top-5 left-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  if (!isVisible) {
    return (
      <>
        {children}
        <div className={getPositionClasses()}>
          <Button
            onClick={() => setIsVisible(true)}
            variant="outline"
            size="sm"
            title='Record the Audit'
            className="rounded-full w-12 h-12 shadow-lg"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  }

  if (isMinimized) {
    return (
      <>
        {children}
        <div className={getPositionClasses()}>
          <Card className="shadow-lg">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Badge variant={isRecording ? "destructive" : "outline"} className="text-xs">
                  P{currentProjectId}
                </Badge>
                
                {isRecording && (
                  <span className="text-xs font-mono">
                    {formatDuration(currentDuration)}
                  </span>
                )}
                
                <Button
                  onClick={() => setIsMinimized(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {children}
      <div className={getPositionClasses()}>
        <Card className="shadow-lg w-80">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="text-sm font-medium">Audio Recorder</span>
                  <Badge variant="outline" className="text-xs">
                    P{currentProjectId}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setIsMinimized(true)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => setIsVisible(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Recovery Alert */}
              {hasRecoveredSessions && (
                <Alert className="p-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <div className="space-y-1">
                      <p>Found {recoveredSessions.length} incomplete recording(s):</p>
                      <div className="space-y-1">
                        {recoveredSessions.map((session) => (
                          <div key={session.sessionId} className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              P{session.projectId} • {Math.floor((session.lastChunkTime - session.startTime) / 1000)}s
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => continueRecoveredSession(session.sessionId)}
                              className="text-[10px] h-5 px-1"
                            >
                              Continue
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => discardRecoveredSession(session.sessionId)}
                              className="text-[10px] h-5 px-1 text-red-600 hover:text-red-700"
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

              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button 
                    onClick={handleStartRecording} 
                    disabled={!isInitialized}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Mic className="h-3 w-3" />
                    Start
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
                      Stop
                    </Button>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDuration(currentDuration)}
                    </span>
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

              {/* Save Form */}
              {currentSession && !isRecording && (
                <div className="space-y-2">
                  <Input
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="Recording name"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveRecording} 
                      disabled={isSavingToServer || !recordingName.trim()}
                      size="sm"
                      className="flex items-center gap-1 text-xs flex-1"
                    >
                      <Save className="h-3 w-3" />
                      {isSavingToServer ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      onClick={discardCurrentRecording} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}

              {/* Status */}
              {currentSession && !isRecording && (
                <p className="text-xs text-muted-foreground">
                  Recording ready: {formatDuration(currentDuration)}
                </p>
              )}

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}