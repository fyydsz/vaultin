import { create } from "zustand";
import { Transaction, api } from "@/lib/api";

interface TransactionState {
  transactionsByAccount: Record<string, Transaction[]>;
  isLoading: Record<string, boolean>;
  isFetched: Record<string, boolean>;
  fetchAccountTransactions: (accountId: string, force?: boolean) => Promise<Transaction[]>;
  invalidateAccount: (accountId: string) => void;
  setAccountTransactions: (accountId: string, transactions: Transaction[]) => void;
}

const inFlightMap = new Map<string, Promise<Transaction[]>>();

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactionsByAccount: {},
  isLoading: {},
  isFetched: {},

  fetchAccountTransactions: async (accountId: string, force = false) => {
    if (!accountId) return [];

    // If already cached and not forced, return cached transactions
    if (get().isFetched[accountId] && !force) {
      return get().transactionsByAccount[accountId] || [];
    }

    // Deduplicate in-flight requests for the same accountId
    const existingPromise = inFlightMap.get(accountId);
    if (existingPromise && !force) {
      return existingPromise;
    }

    set((state) => ({
      isLoading: { ...state.isLoading, [accountId]: true },
    }));

    const fetchPromise = (async () => {
      try {
        const res = await api.getTransactions({ accountId, limit: 100 });
        const list = res.transactions || [];

        set((state) => ({
          transactionsByAccount: {
            ...state.transactionsByAccount,
            [accountId]: list,
          },
          isFetched: {
            ...state.isFetched,
            [accountId]: true,
          },
          isLoading: {
            ...state.isLoading,
            [accountId]: false,
          },
        }));

        return list;
      } catch (err) {
        console.warn(`Failed to fetch transactions for account ${accountId}:`, err);
        set((state) => ({
          isLoading: {
            ...state.isLoading,
            [accountId]: false,
          },
        }));
        return get().transactionsByAccount[accountId] || [];
      } finally {
        inFlightMap.delete(accountId);
      }
    })();

    inFlightMap.set(accountId, fetchPromise);
    return fetchPromise;
  },

  invalidateAccount: (accountId: string) => {
    set((state) => ({
      isFetched: {
        ...state.isFetched,
        [accountId]: false,
      },
    }));
  },

  setAccountTransactions: (accountId: string, transactions: Transaction[]) => {
    set((state) => ({
      transactionsByAccount: {
        ...state.transactionsByAccount,
        [accountId]: transactions,
      },
      isFetched: {
        ...state.isFetched,
        [accountId]: true,
      },
    }));
  },
}));
