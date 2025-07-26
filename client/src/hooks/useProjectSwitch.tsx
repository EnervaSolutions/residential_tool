import { useState } from 'react';
import { useGlobalRecordingStore } from '@/lib/globalRecordingStore';
import { useRecordingSave } from './useRecordingSave';

interface ProjectSwitchOptions {
  onSwitch?: (projectId: number) => void;
  onBlocked?: (reason: string) => void;
}

export function useProjectSwitch(options: ProjectSwitchOptions = {}) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);
  
  const { 
    checkProjectSwitch, 
    forceProjectSwitch, 
    currentSession, 
    currentDuration,
    saveCurrentRecording,
    discardCurrentRecording,
    cleanupAfterSave,
  } = useGlobalRecordingStore();
  
  const { saveRecording: saveToServer, isLoading: isSaving } = useRecordingSave({
    projectId: pendingProjectId || 1,
    onSuccess: async () => {
      if (currentSession && pendingProjectId) {
        await cleanupAfterSave(currentSession.sessionId);
        localStorage.setItem('currentProjectId', pendingProjectId.toString());
        forceProjectSwitch(pendingProjectId);
        options.onSwitch?.(pendingProjectId);
        setIsPrompting(false);
        setPendingProjectId(null);
      }
    },
  });

  const switchProject = async (newProjectId: number, force: boolean = false) => {
    if (force) {
      localStorage.setItem('currentProjectId', newProjectId.toString());
      forceProjectSwitch(newProjectId);
      options.onSwitch?.(newProjectId);
      return;
    }

    const switchStatus = await checkProjectSwitch(newProjectId);

    switch (switchStatus) {
      case 'can_switch':
        localStorage.setItem('currentProjectId', newProjectId.toString());
        forceProjectSwitch(newProjectId);
        options.onSwitch?.(newProjectId);
        break;
        
      case 'has_recording':
        options.onBlocked?.('Cannot switch projects while recording is active. Please stop the recording first.');
        break;
        
      case 'has_unsaved':
        setIsPrompting(true);
        setPendingProjectId(newProjectId);
        break;
    }
  };

  const saveAndSwitch = async (recordingName: string, description?: string) => {
    if (!pendingProjectId || !currentSession) return;

    try {
      const blob = await saveCurrentRecording(recordingName, description);
      await saveToServer({
        audioBlob: blob,
        name: recordingName,
        description: description || '',
        duration: currentDuration,
        mimeType: currentSession.mimeType || 'audio/webm',
      });
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  };

  const discardAndSwitch = async () => {
    if (!pendingProjectId) return;

    await discardCurrentRecording();
    localStorage.setItem('currentProjectId', pendingProjectId.toString());
    forceProjectSwitch(pendingProjectId);
    options.onSwitch?.(pendingProjectId);
    setIsPrompting(false);
    setPendingProjectId(null);
  };

  const cancelSwitch = () => {
    setIsPrompting(false);
    setPendingProjectId(null);
  };

  return {
    switchProject,
    saveAndSwitch,
    discardAndSwitch,
    cancelSwitch,
    isPrompting,
    isSaving,
    pendingProjectId,
    currentSession,
    currentDuration,
  };
}