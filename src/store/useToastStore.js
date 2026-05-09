import { create } from 'zustand';

let nextId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [], // [{ id, message, tone, duration }]

  push: (message, opts = {}) => {
    const id = ++nextId;
    const tone = opts.tone ?? 'default'; // 'default' | 'success' | 'error'
    const duration = opts.duration ?? 2400;
    set({ toasts: [...get().toasts, { id, message, tone, duration }] });
    setTimeout(() => get().dismiss(id), duration);
    return id;
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Helpers ergonomiques.
export const toast = {
  success: (msg, opts) => useToastStore.getState().push(msg, { ...opts, tone: 'success' }),
  error: (msg, opts) => useToastStore.getState().push(msg, { ...opts, tone: 'error' }),
  show: (msg, opts) => useToastStore.getState().push(msg, opts),
};
