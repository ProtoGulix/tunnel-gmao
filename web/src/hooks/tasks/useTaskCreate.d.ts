export interface UseTaskCreateOptions {
  interventionId?: string | null;
  onSuccess?: () => void;
}

export function useTaskCreate(options?: UseTaskCreateOptions): {
  formData: Record<string, unknown>;
  set: (field: string, value: unknown) => void;
  users: unknown[];
  saving: boolean;
  errors: string[];
  reset: () => void;
  handleSubmit: (e?: unknown) => Promise<void>;
};
