import { useState, useRef, useCallback } from 'react';

interface AudioRecorderConfig {
  preferredMimeType?: string;
  sampleRate?: number;
  audioBitsPerSecond?: number;
  maxDurationMs?: number;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
}

interface AudioRecorderReturn extends RecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  getSupportedMimeTypes: () => string[];
}

// Ordered list of preferred MIME types for cross-browser compatibility
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',     // Chrome, Firefox, Edge
  'audio/webm',                 // Chrome, Firefox, Edge fallback
  'audio/mp4;codecs=mp4a.40.2', // Safari, some mobile
  'audio/mp4',                  // Safari fallback
  'audio/ogg;codecs=opus',      // Firefox
  'audio/wav',                  // Universal fallback (larger files)
] as const;

export function useUniversalAudioRecorder(config: AudioRecorderConfig = {}): AudioRecorderReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    mimeType: '',
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Get supported MIME types for current browser
  const getSupportedMimeTypes = useCallback((): string[] => {
    return PREFERRED_MIME_TYPES.filter(mimeType => 
      MediaRecorder.isTypeSupported(mimeType)
    );
  }, []);

  // Get the best supported MIME type
  const getBestMimeType = useCallback((): string => {
    if (config.preferredMimeType && MediaRecorder.isTypeSupported(config.preferredMimeType)) {
      return config.preferredMimeType;
    }

    const supported = getSupportedMimeTypes();
    return supported.length > 0 ? supported[0] : 'audio/wav';
  }, [config.preferredMimeType, getSupportedMimeTypes]);

  // Create MediaRecorder options
  const getMediaRecorderOptions = useCallback(() => {
    const mimeType = getBestMimeType();
    const options: MediaRecorderOptions = { mimeType };

    // Add optional configurations
    if (config.audioBitsPerSecond) {
      options.audioBitsPerSecond = config.audioBitsPerSecond;
    }

    return options;
  }, [getBestMimeType, config.audioBitsPerSecond]);

  // Update timer
  const updateDuration = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
    
    setState(prev => ({ ...prev, duration: elapsed }));

    // Check max duration
    if (config.maxDurationMs && (now - startTimeRef.current) >= config.maxDurationMs) {
      stopRecording();
    }
  }, [config.maxDurationMs]);

  // Start timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    timerRef.current = setInterval(updateDuration, 1000);
  }, [updateDuration]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup resources
  const cleanup = useCallback(() => {
    stopTimer();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
  }, [stopTimer, state.audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setState(prev => ({ 
        ...prev, 
        error: null, 
        audioBlob: null, 
        audioUrl: null, 
        duration: 0 
      }));

      // Get user media with optimal constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(config.sampleRate && { sampleRate: config.sampleRate }),
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create MediaRecorder with best options
      const options = getMediaRecorderOptions();
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = options.mimeType || 'audio/wav';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        setState(prev => ({
          ...prev,
          audioBlob: blob,
          audioUrl: url,
          mimeType,
          isRecording: false,
          isPaused: false,
        }));

        cleanup();
      };

      mediaRecorder.onerror = (event) => {
        setState(prev => ({ 
          ...prev, 
          error: `Recording error: ${event.error?.message || 'Unknown error'}`,
          isRecording: false,
          isPaused: false,
        }));
        cleanup();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimer();

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        mimeType: options.mimeType || 'audio/wav' 
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isRecording: false,
        isPaused: false,
      }));
    }
  }, [config.sampleRate, getMediaRecorderOptions, startTimer, cleanup]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
  }, [state.isRecording, stopTimer]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused, stopTimer]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      
      // Resume timer accounting for paused time
      const pauseStart = Date.now();
      startTimer();
      
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused, startTimer]);

  // Reset recording
  const resetRecording = useCallback(() => {
    cleanup();
    
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      mimeType: '',
      error: null,
    });

    chunksRef.current = [];
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getSupportedMimeTypes,
  };
}