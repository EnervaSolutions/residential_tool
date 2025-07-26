// services/recordingService.ts
import { toast } from "@/hooks/use-toast";
import type { AudioRecording } from "@shared/schema";

export interface SaveRecordingParams {
  audioBlob: Blob;
  name: string;
  description?: string;
  duration: number;
  mimeType: string;
  projectId: number;
}

export interface RecordingValidation {
  isValid: boolean;
  error?: string;
}

export class RecordingService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Validates recording data before saving
   */
  static validateRecording(params: SaveRecordingParams): RecordingValidation {
    if (!params.audioBlob) {
      return { isValid: false, error: "No audio data found" };
    }

    if (!params.name.trim()) {
      return { isValid: false, error: "Please provide a name for the recording" };
    }

    if (params.audioBlob.size === 0) {
      return { isValid: false, error: "Invalid audio recording" };
    }

    if (params.audioBlob.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: "Audio file too large (50MB limit)" };
    }

    return { isValid: true };
  }

  /**
   * Prepares FormData for API submission
   */
  static prepareFormData(params: SaveRecordingParams): FormData {
    const formData = new FormData();
    
    // Determine file extension based on MIME type
    const fileExtension = this.getFileExtension(params.mimeType);
    const fileName = `${params.name.trim()}.${fileExtension}`;
    
    formData.append('audio', params.audioBlob, fileName);
    formData.append('name', params.name.trim());
    formData.append('duration', params.duration.toString());
    formData.append('mimeType', params.mimeType);
    
    if (params.description?.trim()) {
      formData.append('description', params.description.trim());
    }

    return formData;
  }

  /**
   * Saves recording to the server
   */
  static async saveRecording(params: SaveRecordingParams): Promise<AudioRecording> {
    // Validate first
    const validation = this.validateRecording(params);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const formData = this.prepareFormData(params);
      
      const response = await fetch(`/api/projects/${params.projectId}/audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save recording');
      }

      return response.json();
    } catch (error) {
      console.error('Recording save error:', error);
      throw error;
    }
  }

  /**
   * Gets appropriate file extension for MIME type
   */
  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };

    for (const [type, ext] of Object.entries(extensions)) {
      if (mimeType.includes(type)) return ext;
    }
    
    return 'webm'; // fallback for webm as it's most common
  }

  /**
   * Shows appropriate toast messages
   */
  static showSaveSuccess() {
    toast({ title: "Recording saved successfully" });
  }

  static showSaveError(error: string) {
    toast({ 
      title: "Failed to save recording", 
      description: error,
      variant: "destructive" 
    });
  }
}