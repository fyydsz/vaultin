import { create } from "zustand";
import { LabelItem, api } from "@/lib/api";

interface LabelState {
  labels: LabelItem[];
  isLoading: boolean;
  isFetched: boolean;
  error: string | null;
  fetchLabels: (force?: boolean) => Promise<void>;
  createLabel: (data: { name: string; color?: string }) => Promise<LabelItem>;
  updateLabel: (id: string, data: { name?: string; color?: string }) => Promise<LabelItem>;
  deleteLabel: (id: string) => Promise<void>;
}

let inFlightFetch: Promise<void> | null = null;

export const useLabelStore = create<LabelState>((set, get) => ({
  labels: [],
  isLoading: false,
  isFetched: false,
  error: null,

  fetchLabels: async (force = false) => {
    // If already fetched and not forced, return cached data
    if (get().isFetched && !force) {
      return;
    }

    // Reuse existing in-flight request to prevent duplicate calls
    if (inFlightFetch && !force) {
      return inFlightFetch;
    }

    set({ isLoading: true, error: null });

    inFlightFetch = (async () => {
      try {
        const res = await api.getLabels();
        const labelList = Array.isArray(res?.labels) ? res.labels : [];
        set({ labels: labelList, isFetched: true, isLoading: false, error: null });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load labels";
        set({ isLoading: false, error: message });
      } finally {
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  },

  createLabel: async (data) => {
    const res = await api.createLabel(data);
    const created = res.label;
    set((state) => {
      if (
        state.labels.some(
          (l) =>
            l.id === created.id ||
            l.name.toLowerCase() === created.name.toLowerCase()
        )
      ) {
        return state;
      }
      return { labels: [...state.labels, created] };
    });
    return created;
  },

  updateLabel: async (id, data) => {
    const res = await api.updateLabel(id, data);
    const updated = res.label;
    set((state) => ({
      labels: state.labels.map((l) => (l.id === id ? updated : l)),
    }));
    return updated;
  },

  deleteLabel: async (id) => {
    await api.deleteLabel(id);
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
    }));
  },
}));
