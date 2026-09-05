import { describe, it, expect } from "bun:test";
import { useCategoryStore } from "../category-store";
import { useLabelStore } from "../label-store";
import { useTransactionStore } from "../transaction-store";

describe("Category & Label & Transaction Zustand Stores", () => {
  it("should initialize category store with default categories", () => {
    const categories = useCategoryStore.getState().categories;
    expect(categories.length).toBeGreaterThan(0);
    expect(useCategoryStore.getState().isFetched).toBe(false);
  });

  it("should initialize label store", () => {
    const labels = useLabelStore.getState().labels;
    expect(Array.isArray(labels)).toBe(true);
    expect(useLabelStore.getState().isFetched).toBe(false);
  });

  it("should initialize transaction store and allow caching & invalidation", () => {
    const store = useTransactionStore.getState();
    expect(store.transactionsByAccount).toBeDefined();

    store.setAccountTransactions("acc-123", [
      {
        id: "tx-1",
        userId: "u-1",
        accountId: "acc-123",
        amount: 50000,
        type: "INCOME",
        date: "2026-08-19",
        description: "Test",
        category: "salary_income",
        labels: [],
        createdAt: "2026-08-19",
        updatedAt: "2026-08-19",
      },
    ]);

    expect(useTransactionStore.getState().isFetched["acc-123"]).toBe(true);
    expect(useTransactionStore.getState().transactionsByAccount["acc-123"].length).toBe(1);

    useTransactionStore.getState().invalidateAccount("acc-123");
    expect(useTransactionStore.getState().isFetched["acc-123"]).toBe(false);
  });
});
