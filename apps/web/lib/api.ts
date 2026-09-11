export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AccountType =
  | "SAVINGS"
  | "CREDIT_CARD"
  | "TIME_DEPOSIT"
  | "INVESTMENT"
  | "PAYLATER"
  | "CASH"
  | "OTHER";

export type ProviderType = "BANK" | "E_WALLET" | "CASH" | "OTHER";

export interface MonthlyStat {
  month: string;
  shortMonth: string;
  year: number;
  balance: number;
  income: number;
  expense: number;
  net: number;
}

export interface BankVault {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType | string;
  providerType: ProviderType | string;
  providerName: string;
  balance: number;
  currency: string;
  color?: string | null;
  isDefault: boolean;
  transactions?: Transaction[];
  monthlyStats?: MonthlyStat[];
  createdAt: string;
  updatedAt: string;
}

export interface VaultSummary {
  totalBalance: number;
  count: number;
}

export interface CreateVaultInput {
  name: string;
  accountType: AccountType | string;
  providerType: ProviderType | string;
  providerName: string;
  balance?: number;
  currency?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateVaultInput {
  name?: string;
  accountType?: AccountType | string;
  providerType?: ProviderType | string;
  providerName?: string;
  currency?: string;
  color?: string;
  isDefault?: boolean;
}

export interface VaultPresets {
  accountTypes: string[];
  providerTypes: string[];
  popularBanks: string[];
  popularEWallets: string[];
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  icon?: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
}

export interface LabelItem {
  id: string;
  userId?: string;
  name: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BudgetRolloverType = "RESET" | "CARRY_OVER";
export type BudgetStatus = "ON_TRACK" | "WARNING" | "OVERBUDGET";

export interface MonthlyBudgetStat {
  month: string;
  shortMonth: string;
  year: number;
  spent: number;
  limit: number;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  categorySlug: string;
  labels?: string[];
  amount: number;
  baseAmount?: number;
  effectiveAmount: number;
  carryOverAmount?: number;
  period: string;
  rolloverType: BudgetRolloverType | string;
  startDate?: string | null;
  endDate?: string | null;
  color?: string | null;
  icon?: string | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus | string;
  transactionCount?: number;
  safeDailySpend?: number;
  remainingDays?: number;
  monthlyStats?: MonthlyBudgetStat[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  count: number;
  overbudgetCount: number;
  warningCount: number;
  onTrackCount: number;
}

export interface CreateBudgetInput {
  name: string;
  categorySlug: string;
  labels?: string[];
  amount: number;
  period?: string;
  rolloverType?: BudgetRolloverType | string;
  startDate?: string;
  endDate?: string;
  color?: string;
  icon?: string;
}

export interface UpdateBudgetInput {
  name?: string;
  categorySlug?: string;
  labels?: string[];
  amount?: number;
  period?: string;
  rolloverType?: BudgetRolloverType | string;
  startDate?: string;
  endDate?: string;
  color?: string;
  icon?: string;
}

export type GoalCategory =
  | "couple"
  | "travel"
  | "emergency"
  | "gadget"
  | "investment"
  | "education"
  | "general";

export interface GoalMember {
  id: string;
  name: string;
  username?: string | null;
  image?: string | null;
  role: string;
  status: string;
  totalContributed: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  category: GoalCategory | string;
  icon?: string | null;
  deadline?: string | null;
  creatorId: string;
  isShared: boolean;
  status: "active" | "completed" | "cancelled" | string;
  progressPercent: number;
  members?: GoalMember[];
  creator?: {
    name: string;
    username?: string | null;
    email: string;
    image?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetAmount: number;
  category?: GoalCategory | string;
  icon?: string;
  deadline?: string;
  isShared?: boolean;
  invitedFriendIds?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  targetAmount?: number;
  category?: GoalCategory | string;
  icon?: string;
  deadline?: string;
  status?: "active" | "completed" | "cancelled";
}

export interface ContributeGoalInput {
  amount: number;
  accountId?: string;
}

export interface WithdrawGoalInput {
  amount: number;
  accountId: string;
}

export interface GoalInvitation {
  invitationId: string;
  goal: {
    id: string;
    title: string;
    description?: string | null;
    targetAmount: number;
    currentAmount: number;
    category: string;
    icon?: string | null;
    deadline?: string | null;
    creator: {
      name: string;
      username?: string | null;
      email: string;
      image?: string | null;
    };
  };
  invitedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  date: string;
  description: string;
  category: string;
  labels: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  account?: {
    name: string;
    accountType: string;
    providerType: string;
    providerName: string;
    color?: string | null;
  };
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  // When running in the browser, if NEXT_PUBLIC_API_URL points to localhost/127.0.0.1,
  // but the user is accessing via a local network IP (e.g. 192.168.x.x, 10.x.x.x, mobile device)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const currentHost = window.location.hostname;
    if (
      currentHost !== "localhost" &&
      currentHost !== "127.0.0.1" &&
      (envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || !envUrl)
    ) {
      if (!envUrl) {
        return `http://${currentHost}:8000/v1`;
      }
      const replaced = envUrl
        .replace("://localhost", `://${currentHost}`)
        .replace("://127.0.0.1", `://${currentHost}`);
      return replaced.endsWith("/v1") ? replaced : `${replaced}/v1`;
    }
  }

  const base = envUrl || "http://localhost:8000";
  return base.endsWith("/v1") ? base : `${base}/v1`;
};

export const API_BASE_URL = getApiBaseUrl();

export interface BackendErrorEventDetail {
  message: string;
  status?: number;
  isBackendDown?: boolean;
  isSessionCheck?: boolean;
  source?: "form" | "api" | "session";
}

export const BACKEND_ERROR_EVENT = "backend:connection-error";
export const BACKEND_RECOVERED_EVENT = "backend:recovered";

export function emitBackendError(detail: BackendErrorEventDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<BackendErrorEventDetail>(BACKEND_ERROR_EVENT, { detail })
    );
  }
}

export function emitBackendRecovered() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BACKEND_RECOVERED_EVENT));
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl}/profile`, {
      method: "GET",
      signal: controller.signal,
      credentials: "include",
    });
    clearTimeout(timeoutId);
    if (res.status !== 502 && res.status !== 503 && res.status !== 504) {
      emitBackendRecovered();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Send session cookies with every request
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    const errorMessage = "Something went wrong. Please try again later.";

    emitBackendError({
      message: "Please check your connection and try again.",
      isBackendDown: true,
    });

    throw new ApiError(errorMessage, 0);
  }

  let data: Record<string, unknown> = {};
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  } else {
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = { message: text };
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (
        !currentPath.startsWith("/login") &&
        !currentPath.startsWith("/signup") &&
        currentPath !== "/"
      ) {
        window.location.replace("/login");
      }
    }

    if (response.status >= 500) {
      emitBackendError({
        message: "Something went wrong. Please try again later.",
        status: response.status,
        isBackendDown: response.status === 502 || response.status === 503 || response.status === 504,
      });
    }

    const errorMessage =
      (typeof data?.error === "string" ? data.error : undefined) ||
      (typeof data?.message === "string" ? data.message : undefined) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  // Broadcast recovery if previously errored
  emitBackendRecovered();

  return data as T;
}

export const api = {
  async getProfile(): Promise<{ user: User }> {
    return request<{ user: User }>("/profile", {
      method: "GET",
    });
  },

  // Vault endpoints
  async getVaults(): Promise<{
    vaults: BankVault[];
    summary: VaultSummary;
  }> {
    return request<{
      vaults: BankVault[];
      summary: VaultSummary;
    }>("/vaults", {
      method: "GET",
    });
  },

  async getVaultById(id: string): Promise<{ vault: BankVault }> {
    return request<{ vault: BankVault }>(`/vaults/${id}`, {
      method: "GET",
    });
  },

  async getVaultPresets(): Promise<{ presets: VaultPresets }> {
    return request<{ presets: VaultPresets }>("/vaults/presets", {
      method: "GET",
    });
  },

  async createVault(
    data: CreateVaultInput
  ): Promise<{ message: string; vault: BankVault }> {
    return request<{ message: string; vault: BankVault }>("/vaults", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateVault(
    id: string,
    data: UpdateVaultInput
  ): Promise<{ message: string; vault: BankVault }> {
    return request<{ message: string; vault: BankVault }>(
      `/vaults/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  async deleteVault(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/vaults/${id}`, {
      method: "DELETE",
    });
  },

  // Transaction endpoints
  async getTransactions(query: {
    accountId?: string;
    vaultId?: string;
    category?: string;
    label?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number | string;
    maxAmount?: number | string;
    limit?: number;
    page?: number;
  } = {}): Promise<{
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    const accId = query.vaultId || query.accountId;
    if (accId) params.set("accountId", accId);
    if (query.category) params.set("category", query.category);
    if (query.label) params.set("label", query.label);
    if (query.type) params.set("type", query.type);
    if (query.search) params.set("search", query.search);
    if (query.startDate) params.set("startDate", query.startDate);
    if (query.endDate) params.set("endDate", query.endDate);
    if (query.minAmount !== undefined && query.minAmount !== "")
      params.set("minAmount", query.minAmount.toString());
    if (query.maxAmount !== undefined && query.maxAmount !== "")
      params.set("maxAmount", query.maxAmount.toString());
    if (query.limit) params.set("limit", query.limit.toString());
    if (query.page) params.set("page", query.page.toString());

    const qs = params.toString();
    return request<{
      transactions: Transaction[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/transactions${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  async createTransaction(data: {
    accountId: string;
    amount: number;
    type?: "EXPENSE" | "INCOME" | "TRANSFER";
    date?: string;
    description: string;
    category?: string;
    labels?: string[];
    notes?: string;
    adjustBalance?: boolean;
  }): Promise<{ message: string; transaction: Transaction }> {
    return request<{ message: string; transaction: Transaction }>(
      "/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          category: "other_expense",
          adjustBalance: true,
          ...data,
        }),
      }
    );
  },

  async updateTransaction(
    id: string,
    data: Partial<{
      accountId: string;
      amount: number;
      type: "EXPENSE" | "INCOME" | "TRANSFER";
      date: string;
      description: string;
      category: string;
      labels: string[];
      notes: string;
      adjustBalance: boolean;
    }>
  ): Promise<{ message: string; transaction: Transaction }> {
    return request<{ message: string; transaction: Transaction }>(
      `/transactions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  },

  async deleteTransaction(
    id: string,
    adjustBalance: boolean = true
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/transactions/${id}?adjustBalance=${adjustBalance}`,
      {
        method: "DELETE",
      }
    );
  },

  // Category & Label endpoints
  async getCategories(): Promise<{
    presets: CategoryItem[];
    custom: CategoryItem[];
    all: CategoryItem[];
  }> {
    return request<{
      presets: CategoryItem[];
      custom: CategoryItem[];
      all: CategoryItem[];
    }>("/categories", {
      method: "GET",
    });
  },

  async createCategory(data: {
    name: string;
    type: "EXPENSE" | "INCOME";
    icon?: string;
    color?: string;
    description?: string;
  }): Promise<{ message: string; category: CategoryItem }> {
    return request<{ message: string; category: CategoryItem }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCategory(
    id: string,
    data: {
      name?: string;
      type?: "EXPENSE" | "INCOME";
      icon?: string;
      color?: string;
      description?: string;
    }
  ): Promise<{ message: string; category: CategoryItem }> {
    return request<{ message: string; category: CategoryItem }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: "DELETE",
    });
  },

  async getLabels(): Promise<{ labels: LabelItem[] }> {
    return request<{ labels: LabelItem[] }>("/labels", {
      method: "GET",
    });
  },

  async createLabel(data: {
    name: string;
    color?: string;
  }): Promise<{ message: string; label: LabelItem }> {
    return request<{ message: string; label: LabelItem }>("/labels", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateLabel(
    id: string,
    data: { name?: string; color?: string }
  ): Promise<{ message: string; label: LabelItem }> {
    return request<{ message: string; label: LabelItem }>(`/labels/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteLabel(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/labels/${id}`, {
      method: "DELETE",
    });
  },

  // Budget endpoints
  async getBudgets(query: { month?: string } = {}): Promise<{
    budgets: Budget[];
    summary: BudgetSummary;
    selectedMonth: string;
    monthName: string;
    year: number;
  }> {
    const params = new URLSearchParams();
    if (query.month) params.set("month", query.month);
    const qs = params.toString();
    return request<{
      budgets: Budget[];
      summary: BudgetSummary;
      selectedMonth: string;
      monthName: string;
      year: number;
    }>(`/budgets${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  async getBudgetById(
    id: string,
    month?: string
  ): Promise<{ budget: Budget; recentTransactions: Transaction[] }> {
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";
    return request<{ budget: Budget; recentTransactions: Transaction[] }>(
      `/budgets/${id}${qs}`,
      {
        method: "GET",
      }
    );
  },

  async createBudget(
    data: CreateBudgetInput
  ): Promise<{ message: string; budget: Budget }> {
    return request<{ message: string; budget: Budget }>("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateBudget(
    id: string,
    data: UpdateBudgetInput
  ): Promise<{ message: string; budget: Budget }> {
    return request<{ message: string; budget: Budget }>(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteBudget(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/budgets/${id}`, {
      method: "DELETE",
    });
  },

  // Goal endpoints
  async getGoals(query: { status?: string; isShared?: boolean } = {}): Promise<{
    goals: Goal[];
  }> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (typeof query.isShared === "boolean")
      params.set("isShared", String(query.isShared));
    const qs = params.toString();
    return request<{ goals: Goal[] }>(`/goals${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  async getGoalById(id: string): Promise<{ goal: Goal }> {
    return request<{ goal: Goal }>(`/goals/${id}`, {
      method: "GET",
    });
  },

  async createGoal(
    data: CreateGoalInput
  ): Promise<{ message: string; goal: Goal }> {
    return request<{ message: string; goal: Goal }>("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateGoal(
    id: string,
    data: UpdateGoalInput
  ): Promise<{ message: string; goal: Goal }> {
    return request<{ message: string; goal: Goal }>(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteGoal(
    id: string,
    refundAccountId?: string
  ): Promise<{ success: boolean; message: string; refundedAmount?: number }> {
    const url = refundAccountId
      ? `/goals/${id}?refundAccountId=${encodeURIComponent(refundAccountId)}`
      : `/goals/${id}`;
    return request<{ success: boolean; message: string; refundedAmount?: number }>(url, {
      method: "DELETE",
    });
  },

  async withdrawGoal(
    id: string,
    data: WithdrawGoalInput
  ): Promise<{
    message: string;
    currentAmount: number;
    targetAmount: number;
    totalContributed: number;
    status: string;
  }> {
    return request<{
      message: string;
      currentAmount: number;
      targetAmount: number;
      totalContributed: number;
      status: string;
    }>(`/goals/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async contributeGoal(
    id: string,
    data: ContributeGoalInput
  ): Promise<{
    message: string;
    currentAmount: number;
    targetAmount: number;
    totalContributed: number;
    status: string;
  }> {
    return request<{
      message: string;
      currentAmount: number;
      targetAmount: number;
      totalContributed: number;
      status: string;
    }>(`/goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getGoalInvitations(): Promise<{
    invitations: GoalInvitation[];
  }> {
    return request<{ invitations: GoalInvitation[] }>("/goals/invitations", {
      method: "GET",
    });
  },

  async inviteGoalMembers(
    id: string,
    friendIds: string[]
  ): Promise<{ message: string; invitedCount: number }> {
    return request<{ message: string; invitedCount: number }>(
      `/goals/${id}/invite`,
      {
        method: "POST",
        body: JSON.stringify({ friendIds }),
      }
    );
  },

  async respondGoalInvitation(
    id: string,
    action: "accept" | "decline"
  ): Promise<{ message: string; member: GoalMember }> {
    return request<{ message: string; member: GoalMember }>(
      `/goals/${id}/invitation`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }
    );
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    username?: string;
    image?: string;
  }): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async checkUsername(username: string): Promise<{
    available: boolean;
    isCurrent?: boolean;
    message?: string;
    reason?: string;
  }> {
    const qs = encodeURIComponent(username);
    return request<{
      available: boolean;
      isCurrent?: boolean;
      message?: string;
      reason?: string;
    }>(`/profile/check-username?username=${qs}`, {
      method: "GET",
    });
  },

  async deleteAccount(password?: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/profile", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
  },

  async sendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/profile/send-verification", {
      method: "POST",
    });
  },
};

