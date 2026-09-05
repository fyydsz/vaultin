import { create } from "zustand";
import { CategoryItem, api } from "@/lib/api";

const FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: "salary_income", slug: "salary_income", name: "Salary & Primary Income", type: "INCOME", icon: "Wallet", color: "#22C55E" },
  { id: "side_income", slug: "side_income", name: "Freelance & Business", type: "INCOME", icon: "Briefcase", color: "#06B6D4" },
  { id: "savings_investment", slug: "savings_investment", name: "Savings & Investments", type: "INCOME", icon: "TrendingUp", color: "#84CC16" },
  { id: "other_income", slug: "other_income", name: "Other Income", type: "INCOME", icon: "PlusCircle", color: "#0EA5E9" },
  { id: "food_beverage", slug: "food_beverage", name: "Food & Beverage", type: "EXPENSE", icon: "Utensils", color: "#F97316" },
  { id: "transportation", slug: "transportation", name: "Transportation", type: "EXPENSE", icon: "Car", color: "#3B82F6" },
  { id: "shopping", slug: "shopping", name: "Shopping & Groceries", type: "EXPENSE", icon: "ShoppingBag", color: "#EC4899" },
  { id: "housing_utilities", slug: "housing_utilities", name: "Housing & Utilities", type: "EXPENSE", icon: "Home", color: "#6366F1" },
  { id: "health", slug: "health", name: "Health & Medical", type: "EXPENSE", icon: "HeartPulse", color: "#EF4444" },
  { id: "beauty", slug: "beauty", name: "Personal Care & Beauty", type: "EXPENSE", icon: "Sparkles", color: "#D946EF" },
  { id: "education", slug: "education", name: "Education & Learning", type: "EXPENSE", icon: "GraduationCap", color: "#10B981" },
  { id: "entertainment", slug: "entertainment", name: "Entertainment & Recreation", type: "EXPENSE", icon: "Gamepad2", color: "#8B5CF6" },
  { id: "gift_donation", slug: "gift_donation", name: "Gifts & Donations", type: "EXPENSE", icon: "Gift", color: "#14B8A6" },
  { id: "other_expense", slug: "other_expense", name: "Other Expense", type: "EXPENSE", icon: "MoreHorizontal", color: "#64748B" },
];

interface CategoryState {
  categories: CategoryItem[];
  isLoading: boolean;
  isFetched: boolean;
  error: string | null;
  fetchCategories: (force?: boolean) => Promise<void>;
  createCategory: (data: {
    name: string;
    type: "EXPENSE" | "INCOME";
    icon?: string;
    color?: string;
    description?: string;
  }) => Promise<CategoryItem>;
  deleteCategory: (id: string) => Promise<void>;
}

let inFlightFetch: Promise<void> | null = null;

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: FALLBACK_CATEGORIES,
  isLoading: false,
  isFetched: false,
  error: null,

  fetchCategories: async (force = false) => {
    // If already fetched and not forced, return cached data
    if (get().isFetched && !force) {
      return;
    }

    // Reuse existing in-flight request to prevent race conditions & duplicate calls
    if (inFlightFetch && !force) {
      return inFlightFetch;
    }

    set({ isLoading: true, error: null });

    inFlightFetch = (async () => {
      try {
        const res = await api.getCategories();
        if (res.all && res.all.length > 0) {
          set({ categories: res.all, isFetched: true, isLoading: false, error: null });
        } else {
          set({ isFetched: true, isLoading: false, error: null });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load categories";
        set({ isLoading: false, error: message });
      } finally {
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  },

  createCategory: async (data) => {
    const res = await api.createCategory(data);
    const created = res.category;
    set((state) => ({
      categories: [...state.categories, created],
    }));
    return created;
  },

  deleteCategory: async (id) => {
    await api.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id && c.slug !== id),
    }));
  },
}));
