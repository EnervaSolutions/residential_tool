import { useState, useRef, useCallback } from 'react';

interface AudioRecorderConfig {
  preferredMimeType?: string;
  sampleRate?: number;
  audioBitsPerSecond?: number;
  maxDurationMs?: number;
  voiceOptimized?: boolean; // New: Enable voice-specific optimizations
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
  estimatedFileSize?: string; // New: Show estimated file size
}

interface AudioRecorderReturn extends RecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  getSupportedMimeTypes: () => string[];
}

// Memory-efficient MIME types prioritizing Opus codec for voice
const VOICE_OPTIMIZED_MIME_TYPES = [
  'audio/webm;codecs=opus',     // Best for voice - Chrome, Firefox, Edge
  'audio/ogg;codecs=opus',      // Firefox, some others
  'audio/webm',                 // Fallback WebM
  'audio/mp4;codecs=mp4a.40.2', // Safari AAC
  'audio/mp4',                  // Safari fallback
  'audio/wav',                  // Last resort (large files)
] as const;

// High-quality MIME types (original behavior)
const HIGH_QUALITY_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav',
] as const;

export function useUniversalAudioRecorder(config: AudioRecorderConfig = {}): AudioRecorderReturn {
  const {
    voiceOptimized = true, // Default to voice optimization
    audioBitsPerSecond = voiceOptimized ? 32000 : undefined, // 32 kbps for voice
    sampleRate = voiceOptimized ? 16000 : undefined, // 16 kHz for voice
    ...restConfig
  } = config;

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    mimeType: '',
    error: null,
    estimatedFileSize: undefined,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Calculate estimated file size based on bitrate and duration
  const calculateEstimatedSize = useCallback((durationSeconds: number): string => {
    if (!audioBitsPerSecond || durationSeconds === 0) return '';
    
    const bytes = (audioBitsPerSecond * durationSeconds) / 8;
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }, [audioBitsPerSecond]);

  // Get supported MIME types for current browser
  const getSupportedMimeTypes = useCallback((): string[] => {
    const mimeTypes = voiceOptimized ? VOICE_OPTIMIZED_MIME_TYPES : HIGH_QUALITY_MIME_TYPES;
    return mimeTypes.filter(mimeType => 
      MediaRecorder.isTypeSupported(mimeType)
    );
  }, [voiceOptimized]);

  // Get the best supported MIME type
  const getBestMimeType = useCallback((): string => {
    if (restConfig.preferredMimeType && MediaRecorder.isTypeSupported(restConfig.preferredMimeType)) {
      return restConfig.preferredMimeType;
    }

    const supported = getSupportedMimeTypes();
    return supported.length > 0 ? supported[0] : 'audio/wav';
  }, [restConfig.preferredMimeType, getSupportedMimeTypes]);

  // Create MediaRecorder options
  const getMediaRecorderOptions = useCallback(() => {
    const mimeType = getBestMimeType();
    const options: MediaRecorderOptions = { mimeType };

    // Add bitrate configuration
    if (audioBitsPerSecond) {
      options.audioBitsPerSecond = audioBitsPerSecond;
    }

    return options;
  }, [getBestMimeType, audioBitsPerSecond]);

  // Update timer and estimated file size
  const updateDuration = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
    const estimatedSize = calculateEstimatedSize(elapsed);
    
    setState(prev => ({ 
      ...prev, 
      duration: elapsed,
      estimatedFileSize: estimatedSize
    }));

    // Check max duration
    if (restConfig.maxDurationMs && (now - startTimeRef.current) >= restConfig.maxDurationMs) {
      stopRecording();
    }
  }, [restConfig.maxDurationMs, calculateEstimatedSize]);

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
        duration: 0,
        estimatedFileSize: undefined
      }));

      // Voice-optimized constraints for memory efficiency
      const audioConstraints = voiceOptimized ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1, // Mono for voice
        ...(sampleRate && { sampleRate }),
      } : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(sampleRate && { sampleRate }),
      };

      const constraints: MediaStreamConstraints = {
        audio: audioConstraints
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create MediaRecorder with optimized options
      const options = getMediaRecorderOptions();
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Log configuration for debugging
      console.log('Recording started with:', {
        mimeType: options.mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond,
        sampleRate,
        voiceOptimized,
        estimatedBitrate: `${audioBitsPerSecond || 'auto'} bps`
      });

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
        const finalSize = blob.size < 1024 ? `${blob.size} B` : 
                         blob.size < 1024 * 1024 ? `${Math.round(blob.size / 1024)} KB` :
                         `${Math.round(blob.size / (1024 * 1024))} MB`;

        console.log('Recording completed:', {
          duration: state.duration,
          fileSize: finalSize,
          compression: voiceOptimized ? 'Voice Optimized' : 'High Quality'
        });

        setState(prev => ({
          ...prev,
          audioBlob: blob,
          audioUrl: url,
          mimeType,
          isRecording: false,
          isPaused: false,
          estimatedFileSize: finalSize,
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

      // Start recording with smaller chunks for better memory management
      mediaRecorder.start(voiceOptimized ? 500 : 100); // 500ms chunks for voice
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
  }, [sampleRate, getMediaRecorderOptions, startTimer, cleanup, voiceOptimized, audioBitsPerSecond, state.duration]);

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
      estimatedFileSize: undefined,
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