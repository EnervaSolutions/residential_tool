// hooks/useRecordingSave.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RecordingService, SaveRecordingParams } from "@/services/recordingService";

interface UseRecordingSaveOptions {
  projectId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useRecordingSave({ 
  projectId, 
  onSuccess, 
  onError 
}: UseRecordingSaveOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: Omit<SaveRecordingParams, 'projectId'>) => {
      return RecordingService.saveRecording({ ...params, projectId });
    },
    onSuccess: () => {
      // Invalidate recordings query to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ["/api/projects", projectId, "audio"] 
      });
      
      RecordingService.showSaveSuccess();
      onSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Unknown error occurred";
      RecordingService.showSaveError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const saveRecording = async (params: Omit<SaveRecordingParams, 'projectId'>) => {
    // Validate before attempting save
    const validation = RecordingService.validateRecording({ 
      ...params, 
      projectId 
    });
    
    if (!validation.isValid) {
      RecordingService.showSaveError(validation.error!);
      return;
    }

    mutation.mutate(params);
  };

  return {
    saveRecording,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}