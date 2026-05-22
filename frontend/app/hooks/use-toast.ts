type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

const toastApi = {
  add: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    alert(`${toast.title}: ${toast.description || ''}`);
    return id;
  },
  remove: (_id: string) => {
    // No-op placeholder until a real toast provider is wired up.
  },
};

export function useToast() {
  return {
    toast: toastApi.add,
  };
}