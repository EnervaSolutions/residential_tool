// stores/globalRecordingStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GlobalRecordingStorage, ActiveRecordingSession } from '@/services/globalRecordingStorage';

export interface GlobalRecordingState {
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  isInitialized: boolean;
  
  // Current session
  currentSessionId: string | null;
  currentSession: ActiveRecordingSession | null;
  
  // Project tracking
  lastKnownProjectId: number | null;
  
  // Recorder state
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunkSequence: number;
  
  // Timing
  startTime: number | null;
  pausedDuration: number;
  currentDuration: number;
  
  // Recovery
  hasRecoveredSessions: boolean;
  recoveredSessions: ActiveRecordingSession[];
  
  // Error handling
  error: string | null;
}

export interface GlobalRecordingActions {
  // Initialization
  initialize: () => Promise<void>;
  recoverSessions: () => Promise<void>;
  
  // Recording controls
  startRecording: (projectId: number) => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Project switching
  checkProjectSwitch: (newProjectId: number) => Promise<'can_switch' | 'has_recording' | 'has_unsaved'>;
  forceProjectSwitch: (newProjectId: number) => void;
  
  // Session management
  updateSessionMetadata: (name?: string, description?: string) => Promise<void>;
  saveCurrentRecording: (name: string, description?: string) => Promise<Blob>;
  discardCurrentRecording: () => Promise<void>;
  
  // Recovery actions
  continueRecoveredSession: (sessionId: string) => Promise<void>;
  discardRecoveredSession: (sessionId: string) => Promise<void>;

  // Cleanup after save
  cleanupAfterSave: (sessionId: string) => Promise<void>;
  
  // Utility
  updateDuration: () => void;
  clearError: () => void;
  reset: () => void;
}

type GlobalRecordingStore = GlobalRecordingState & GlobalRecordingActions;

const CHUNK_INTERVAL_MS = 10000; // Save chunks every 10 seconds

export const useGlobalRecordingStore = create<GlobalRecordingStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isRecording: false,
    isPaused: false,
    isInitialized: false,
    currentSessionId: null,
    currentSession: null,
    lastKnownProjectId: null,
    mediaRecorder: null,
    stream: null,
    chunkSequence: 0,
    startTime: null,
    pausedDuration: 0,
    currentDuration: 0,
    hasRecoveredSessions: false,
    recoveredSessions: [],
    error: null,

    // Initialize the store and IndexedDB
    initialize: async () => {
      try {
        await GlobalRecordingStorage.init();
        set({ isInitialized: true });
      } catch (error) {
        console.error('Failed to initialize global recording storage:', error);
        set({ error: 'Failed to initialize recording storage' });
      }
    },

    // Recover any active sessions from previous browser sessions
    recoverSessions: async () => {
      try {
        const activeSessions = await GlobalRecordingStorage.getActiveRecordingSessions();
        set({ 
          recoveredSessions: activeSessions,
          hasRecoveredSessions: activeSessions.length > 0 
        });
      } catch (error) {
        console.error('Failed to recover sessions:', error);
        set({ error: 'Failed to recover previous recordings' });
      }
    },

    // Start a new recording
    startRecording: async (projectId: number) => {
      const state = get();
      if (state.isRecording) {
        throw new Error('Recording already in progress');
      }

      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use Safari-compatible MIME type selection (similar to your existing approach)
        const VOICE_OPTIMIZED_MIME_TYPES = [
          'audio/webm;codecs=opus',     // Best for voice - Chrome, Firefox, Edge
          'audio/ogg;codecs=opus',      // Firefox, some others
          'audio/webm',                 // Fallback WebM
          'audio/mp4;codecs=mp4a.40.2', // Safari AAC
          'audio/mp4',                  // Safari fallback
          'audio/wav',                  // Last resort (large files)
        ];

        // Get the first supported MIME type
        let selectedMimeType = 'audio/wav'; // fallback
        for (const mimeType of VOICE_OPTIMIZED_MIME_TYPES) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            break;
          }
        }

        // Safari-specific recorder options
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        const recorderOptions = {
          mimeType: selectedMimeType,
          audioBitsPerSecond: isSafari ? 64000 : 32000, // Higher bitrate for Safari
        };

        console.log('Starting recording with:', { selectedMimeType, recorderOptions, isSafari });

        // Create new session in IndexedDB
        const sessionId = await GlobalRecordingStorage.startRecordingSession(projectId, selectedMimeType);
        
        // Update last known project ID
        set({ lastKnownProjectId: projectId });
        
        // Create MediaRecorder with browser-specific options
        const mediaRecorder = new MediaRecorder(stream, recorderOptions);

        let chunkSequence = 0;

        // Handle data available (chunks) with Safari validation
        mediaRecorder.ondataavailable = async (event) => {
          console.log('Chunk received:', { 
            size: event.data.size, 
            type: event.data.type, 
            sequence: chunkSequence 
          });
          
          if (event.data.size > 0) {
            try {
              // Safari validation: Check if chunk actually contains audio data
              const buffer = await event.data.arrayBuffer();
              console.log('Chunk buffer validation:', {
                reportedSize: event.data.size,
                actualBufferSize: buffer.byteLength,
                hasData: buffer.byteLength > 0
              });

              // Only save chunks with actual data
              if (buffer.byteLength > 0) {
                await GlobalRecordingStorage.saveRecordingChunk(sessionId, event.data, chunkSequence);
                set({ chunkSequence: chunkSequence + 1 });
                chunkSequence++;
              } else {
                console.warn('Skipping empty chunk (Safari issue), sequence:', chunkSequence);
              }
            } catch (error) {
              console.error('Failed to save recording chunk:', error);
              set({ error: 'Failed to save recording data' });
            }
          } else {
            console.warn('Received empty chunk, sequence:', chunkSequence);
          }
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          set({ error: 'Recording error occurred' });
        };

        // Handle state changes
        mediaRecorder.onstart = () => {
          console.log('MediaRecorder started');
        };

        mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
        };

        // Start recording with chunks - different intervals for different browsers
        const chunkInterval = isSafari ? 5000 : CHUNK_INTERVAL_MS; // Shorter intervals for Safari
        
        console.log('Starting with chunk interval:', chunkInterval);
        mediaRecorder.start(chunkInterval);

        const now = Date.now();
        const session = await GlobalRecordingStorage.getActiveRecording(sessionId);

        set({
          isRecording: true,
          isPaused: false,
          currentSessionId: sessionId,
          currentSession: session,
          mediaRecorder,
          stream,
          chunkSequence: 0,
          startTime: now,
          pausedDuration: 0,
          currentDuration: 0,
          error: null,
        });

        // Start duration timer
        const durationInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isRecording) {
            clearInterval(durationInterval);
            return;
          }
          currentState.updateDuration();
        }, 1000);

      } catch (error) {
        console.error('Failed to start recording:', error);
        set({ error: 'Failed to start recording. Check microphone permissions.' });
        throw error;
      }
    },

    // Stop recording
    stopRecording: async () => {
      const state = get();
      if (!state.isRecording || !state.mediaRecorder || !state.currentSessionId) {
        return;
      }

      try {
        // For Safari: Ensure final chunk is properly captured
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        if (isSafari && state.mediaRecorder.state === 'recording') {
          console.log('Safari: Requesting final chunk before stop');
          // Request final chunk for Safari
          state.mediaRecorder.requestData();
          
          // Small delay to ensure chunk is processed
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Stop media recorder
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
          state.mediaRecorder.stop();
          
          // Wait for stop event to ensure all chunks are processed
          await new Promise(resolve => {
            const originalOnStop = state.mediaRecorder!.onstop;
            state.mediaRecorder!.onstop = function (event) {
              console.log('MediaRecorder stopped, all chunks should be saved');
              if (originalOnStop) originalOnStop.call(this, event);
              resolve(undefined);
            };
          });
        }

        // Stop media stream
        if (state.stream) {
          state.stream.getTracks().forEach(track => track.stop());
        }

        // DON'T mark session as completed yet - keep it active for saving
        // Session will be marked as completed only after successful save

        set({
          isRecording: false,
          isPaused: false,
          error: null,
        });

      } catch (error) {
        console.error('Failed to stop recording:', error);
        set({ error: 'Failed to stop recording' });
      }
    },

    // Pause recording
    pauseRecording: () => {
      const state = get();
      if (!state.isRecording || state.isPaused || !state.mediaRecorder) {
        return;
      }

      if (state.mediaRecorder.state === 'recording') {
        state.mediaRecorder.pause();
        set({ isPaused: true });
      }
    },

    // Resume recording
    resumeRecording: () => {
      const state = get();
      if (!state.isRecording || !state.isPaused || !state.mediaRecorder) {
        return;
      }

      if (state.mediaRecorder.state === 'paused') {
        state.mediaRecorder.resume();
        set({ isPaused: false });
      }
    },

    // Check if project can be switched
    checkProjectSwitch: async (newProjectId: number): Promise<'can_switch' | 'has_recording' | 'has_unsaved'> => {
      const state = get();
      
      // If switching to same project, always allow
      if (state.lastKnownProjectId === newProjectId) {
        return 'can_switch';
      }
      
      // If no recording activity, allow switch
      if (!state.isRecording && !state.currentSession) {
        return 'can_switch';
      }
      
      // If actively recording, block switch
      if (state.isRecording) {
        return 'has_recording';
      }
      
      // If has unsaved recording, prompt to save
      if (state.currentSession && !state.isRecording) {
        return 'has_unsaved';
      }
      
      return 'can_switch';
    },

    // Force project switch (used after user confirms)
    forceProjectSwitch: (newProjectId: number) => {
      set({ lastKnownProjectId: newProjectId });
    },

    // Update session metadata
    updateSessionMetadata: async (name?: string, description?: string) => {
      const state = get();
      if (!state.currentSessionId) return;

      try {
        await GlobalRecordingStorage.updateSessionMetadata(state.currentSessionId, {
          name,
          description,
        });

        // Update local session copy
        if (state.currentSession) {
          set({
            currentSession: {
              ...state.currentSession,
              name,
              description,
            }
          });
        }
      } catch (error) {
        console.error('Failed to update session metadata:', error);
        set({ error: 'Failed to update recording information' });
      }
    },

    // Save current recording and return the blob
    saveCurrentRecording: async (name: string, description?: string): Promise<Blob> => {
      const state = get();
      if (!state.currentSessionId) {
        throw new Error('No active recording session');
      }

      try {
        // Update metadata first
        await state.updateSessionMetadata(name, description);

        // Get complete recording (session should still be active at this point)
        const result = await GlobalRecordingStorage.getCompleteRecording(state.currentSessionId);
        if (!result) {
          throw new Error('Failed to retrieve recording data');
        }

        // Mark session as completed ONLY after successful retrieval
        await GlobalRecordingStorage.completeRecordingSession(state.currentSessionId);

        // Clear the current session from store since it's now completed
        set({
          currentSessionId: null,
          currentSession: null,
          chunkSequence: 0,
          startTime: null,
          pausedDuration: 0,
          currentDuration: 0,
        });

        return result.blob;
      } catch (error) {
        console.error('Failed to save current recording:', error);
        set({ error: 'Failed to save recording' });
        throw error;
      }
    },

    // Discard current recording
    discardCurrentRecording: async () => {
      const state = get();
      if (!state.currentSessionId) return;

      try {
        // Clean up the recording data from IndexedDB
        await GlobalRecordingStorage.cleanupRecording(state.currentSessionId);
        
        // Reset the store state
        set({
          currentSessionId: null,
          currentSession: null,
          chunkSequence: 0,
          startTime: null,
          pausedDuration: 0,
          currentDuration: 0,
          error: null,
        });
      } catch (error) {
        console.error('Failed to discard recording:', error);
        set({ error: 'Failed to discard recording' });
      }
    },

    // Continue a recovered session
    continueRecoveredSession: async (sessionId: string) => {
      const state = get();
      const session = state.recoveredSessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        throw new Error('Recovered session not found');
      }

      try {
        // Get user media for continuing
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use the same MIME type as the original session with Safari-optimized settings
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        const recorderOptions = {
          mimeType: session.mimeType,
          audioBitsPerSecond: isSafari ? 64000 : 32000,
        };
        
        console.log('Continuing session with:', { 
          mimeType: session.mimeType, 
          recorderOptions,
          totalChunks: session.totalChunks 
        });

        // Create new MediaRecorder with same settings
        const mediaRecorder = new MediaRecorder(stream, recorderOptions);

        let chunkSequence = session.totalChunks; // Continue from where we left off

        mediaRecorder.ondataavailable = async (event) => {
          console.log('Continuation chunk received:', { 
            size: event.data.size, 
            type: event.data.type, 
            sequence: chunkSequence 
          });
          
          if (event.data.size > 0) {
            try {
              // Safari validation for continued recording
              const buffer = await event.data.arrayBuffer();
              console.log('Continuation chunk buffer validation:', {
                reportedSize: event.data.size,
                actualBufferSize: buffer.byteLength,
                hasData: buffer.byteLength > 0
              });

              // Only save chunks with actual data
              if (buffer.byteLength > 0) {
                await GlobalRecordingStorage.saveRecordingChunk(sessionId, event.data, chunkSequence);
                set({ chunkSequence: chunkSequence + 1 });
                chunkSequence++;
              } else {
                console.warn('Skipping empty continuation chunk (Safari issue), sequence:', chunkSequence);
              }
            } catch (error) {
              console.error('Failed to save recording chunk:', error);
              set({ error: 'Failed to save recording data' });
            }
          }
        };

        // Browser-specific chunk interval
        const chunkInterval = isSafari ? 5000 : CHUNK_INTERVAL_MS;
        
        mediaRecorder.start(chunkInterval);

        // Calculate proper duration accounting for the gap
        const recordedDuration = Math.floor((session.lastChunkTime - session.startTime) / 1000);

        set({
          isRecording: true,
          isPaused: false,
          currentSessionId: sessionId,
          currentSession: session,
          mediaRecorder,
          stream,
          chunkSequence: session.totalChunks,
          startTime: Date.now() - (recordedDuration * 1000), // Adjust start time to maintain duration continuity
          pausedDuration: 0, // Reset paused duration
          currentDuration: recordedDuration, // Start from where we left off
          recoveredSessions: state.recoveredSessions.filter(s => s.sessionId !== sessionId),
          hasRecoveredSessions: state.recoveredSessions.length > 1,
          error: null,
        });

        // Start duration timer
        const durationInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isRecording) {
            clearInterval(durationInterval);
            return;
          }
          currentState.updateDuration();
        }, 1000);

      } catch (error) {
        console.error('Failed to continue recovered session:', error);
        set({ error: 'Failed to continue previous recording' });
        throw error;
      }
    },

    // Discard a recovered session
    discardRecoveredSession: async (sessionId: string) => {
      try {
        await GlobalRecordingStorage.cleanupRecording(sessionId);
        
        set(state => ({
          recoveredSessions: state.recoveredSessions.filter(s => s.sessionId !== sessionId),
          hasRecoveredSessions: state.recoveredSessions.length > 1,
        }));
      } catch (error) {
        console.error('Failed to discard recovered session:', error);
        set({ error: 'Failed to discard previous recording' });
      }
    },

    // Cleanup after successful save to server
    cleanupAfterSave: async (sessionId: string) => {
      try {
        await GlobalRecordingStorage.cleanupRecording(sessionId);
      } catch (error) {
        console.error('Failed to cleanup after save:', error);
        // Don't throw error here as save was successful
      }
    },

    // Update current duration
    updateDuration: () => {
      const state = get();
      if (!state.isRecording || !state.startTime || state.isPaused) return;

      const elapsed = Math.floor((Date.now() - state.startTime - state.pausedDuration) / 1000);
      set({ currentDuration: elapsed });
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Reset store to initial state
    reset: () => {
      const state = get();
      
      // Clean up media resources
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
      }
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }

      set({
        isRecording: false,
        isPaused: false,
        currentSessionId: null,
        currentSession: null,
        mediaRecorder: null,
        stream: null,
        chunkSequence: 0,
        startTime: null,
        pausedDuration: 0,
        currentDuration: 0,
        error: null,
      });
    },
  }))
);