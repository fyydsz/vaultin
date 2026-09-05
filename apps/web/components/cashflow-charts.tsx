"use client";

import React, { useState } from "react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { getCategoryIcon } from "@/components/category-select";
import { PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Color constants
const COLOR_INFLOW = "#10B981"; // Emerald green
const COLOR_OUTFLOW = "#F43F5E"; // Rose red
const COLOR_NET = "#8B5CF6"; // Purple
const PIE_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#E11D48", // Rose
  "#84CC16", // Lime
  "#64748B", // Slate
];

const inflowOutflowConfig = {
  income: {
    label: "Inflow (Income)",
    color: COLOR_INFLOW,
  },
  expense: {
    label: "Outflow (Expense)",
    color: COLOR_OUTFLOW,
  },
  net: {
    label: "Net Cashflow",
    color: COLOR_NET,
  },
} satisfies ChartConfig;

const cumulativeConfig = {
  cumulativeNet: {
    label: "Cumulative Net Cashflow",
    color: COLOR_INFLOW,
  },
} satisfies ChartConfig;

// Helper to format currency in IDR
export const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompact = (val: number) => {
  const abs = Math.abs(val);
  if (abs >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return `${val}`;
};

// Hook for mobile touch-only tooltip interaction (prevents popup while scrolling)
function useChartTouchTooltip() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.matchMedia("(hover: none), (pointer: coarse)");
      setIsTouchDevice(match.matches);
      const listener = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
      match.addEventListener("change", listener);
      return () => match.removeEventListener("change", listener);
    }
  }, []);

  const tooltipTrigger: "hover" | "click" = isTouchDevice ? "click" : "hover";

  // Dismiss active tooltip when clicking / tapping anywhere outside the chart
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsTooltipOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  return {
    containerRef,
    isTouchDevice,
    isTooltipOpen,
    setIsTooltipOpen,
    tooltipTrigger,
  };
}

// =========================================================================
// 1. INFLOW VS OUTFLOW DUAL BAR + NET LINE CHART
// =========================================================================

export interface CashflowPoint {
  label: string;
  fullDate: string;
  income: number;
  expense: number;
  net: number;
  cumulativeNet: number;
  savingsRate?: number;
}

interface CashflowInflowOutflowChartProps {
  data: CashflowPoint[];
  isLoading?: boolean;
  className?: string;
}

export function CashflowInflowOutflowChart({
  data = [],
  isLoading = false,
  className = "",
}: CashflowInflowOutflowChartProps) {
  const {
    containerRef,
    isTooltipOpen,
    setIsTooltipOpen,
    tooltipTrigger,
  } = useChartTouchTooltip();

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      onPointerDown={() => setIsTooltipOpen(true)}
      onMouseEnter={() => setIsTooltipOpen(true)}
    >
      <ChartContainer
        config={inflowOutflowConfig}
        className={cn(
          "h-[320px] w-full aspect-auto",
          !isTooltipOpen && "[&_.recharts-tooltip-wrapper]:!hidden"
        )}
      >
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
            tickFormatter={formatCompact}
            stroke="var(--muted-foreground)"
          />
          <ChartTooltip
            trigger={tooltipTrigger}
            cursor={false}
            content={<CustomInflowOutflowTooltip />}
          />

          {/* Income Bar */}
          <Bar
            dataKey="income"
            name="Inflow"
            fill={COLOR_INFLOW}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />

          {/* Expense Bar */}
          <Bar
            dataKey="expense"
            name="Outflow"
            fill={COLOR_OUTFLOW}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />

          {/* Net Line */}
          <Line
            type="monotone"
            dataKey="net"
            name="Net Flow"
            stroke={COLOR_NET}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLOR_NET }}
            activeDot={
              isTooltipOpen
                ? { r: 5, fill: COLOR_NET, stroke: "#fff", strokeWidth: 2 }
                : false
            }
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

function CustomInflowOutflowTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload as CashflowPoint;
  if (!pt) return null;

  const isNetPositive = pt.net >= 0;
  const savingsRate =
    pt.income > 0 ? Math.round(((pt.income - pt.expense) / pt.income) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/70 bg-background/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[200px] space-y-2 animate-in fade-in-0 zoom-in-95">
      <div className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-1.5">
        {pt.fullDate || pt.label}
      </div>

      <div className="space-y-1.5 text-xs">
        {/* Income */}
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Inflow:
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            +{formatIDR(pt.income)}
          </span>
        </div>

        {/* Expense */}
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-rose-500" />
            Outflow:
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            -{formatIDR(pt.expense)}
          </span>
        </div>

        {/* Net Cashflow */}
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/40">
          <span className="font-semibold text-foreground">Net Flow:</span>
          <span
            className={`font-mono font-bold ${
              isNetPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isNetPositive ? "+" : "-"}
            {formatIDR(Math.abs(pt.net))}
          </span>
        </div>

        {/* Savings Rate */}
        {pt.income > 0 && (
          <div className="flex items-center justify-between gap-4 pt-0.5 text-[11px] text-muted-foreground">
            <span>Savings Rate:</span>
            <span
              className={`font-semibold font-mono ${
                savingsRate >= 20
                  ? "text-emerald-600 dark:text-emerald-400"
                  : savingsRate >= 0
                  ? "text-amber-500"
                  : "text-rose-500"
              }`}
            >
              {savingsRate}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 2. CUMULATIVE SAVINGS GROWTH AREA CHART
// =========================================================================

interface CashflowCumulativeAreaChartProps {
  data: CashflowPoint[];
  isLoading?: boolean;
  className?: string;
}

export function CashflowCumulativeAreaChart({
  data = [],
  isLoading = false,
  className = "",
}: CashflowCumulativeAreaChartProps) {
  const isNetEndPositive = data.length > 0 && data[data.length - 1].cumulativeNet >= 0;
  const gradientColor = isNetEndPositive ? COLOR_INFLOW : COLOR_OUTFLOW;

  const {
    containerRef,
    isTooltipOpen,
    setIsTooltipOpen,
    tooltipTrigger,
  } = useChartTouchTooltip();

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      onPointerDown={() => setIsTooltipOpen(true)}
      onMouseEnter={() => setIsTooltipOpen(true)}
    >
      <ChartContainer
        config={cumulativeConfig}
        className={cn(
          "h-[220px] w-full aspect-auto",
          !isTooltipOpen && "[&_.recharts-tooltip-wrapper]:!hidden"
        )}
      >
        <AreaChart
          data={data}
          margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
        >
          <defs>
            <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={gradientColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.3}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
            tickFormatter={formatCompact}
            stroke="var(--muted-foreground)"
          />
          <ChartTooltip
            trigger={tooltipTrigger}
            cursor={false}
            content={<CustomCumulativeTooltip />}
          />
          <Area
            type="monotone"
            dataKey="cumulativeNet"
            stroke={gradientColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#cashflowGradient)"
            activeDot={
              isTooltipOpen
                ? { r: 4, fill: gradientColor, stroke: "#fff", strokeWidth: 1.5 }
                : false
            }
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function CustomCumulativeTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload as CashflowPoint;
  if (!pt) return null;

  const isPos = pt.cumulativeNet >= 0;

  return (
    <div className="rounded-xl border border-border/70 bg-background/95 p-2.5 text-xs shadow-xl backdrop-blur-md min-w-[170px] space-y-1 animate-in fade-in-0 zoom-in-95">
      <div className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-1">
        {pt.fullDate || pt.label}
      </div>
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <span className="text-muted-foreground">Cumulative Net:</span>
        <span
          className={`font-mono font-bold ${
            isPos
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {isPos ? "+" : "-"}
          {formatIDR(Math.abs(pt.cumulativeNet))}
        </span>
      </div>
    </div>
  );
}

// =========================================================================
// 3. CATEGORY DISTRIBUTION DONUT CHART & RANKED BARS
// =========================================================================

export interface CategoryBreakdownItem {
  category: string;
  name: string;
  type: string;
  totalAmount: number;
  count: number;
  percentage: number;
  color: string;
  icon?: string;
}

interface CashflowCategoryDonutChartProps {
  categories: CategoryBreakdownItem[];
  type?: "EXPENSE" | "INCOME";
  className?: string;
}

export function CashflowCategoryDonutChart({
  categories = [],
  type = "EXPENSE",
  className = "",
}: CashflowCategoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const {
    containerRef,
    isTooltipOpen,
    setIsTooltipOpen,
    tooltipTrigger,
  } = useChartTouchTooltip();

  const totalAmount = categories.reduce((sum, c) => sum + c.totalAmount, 0);

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
        <PieChartIcon className="size-8 opacity-30 mb-2" />
        <p className="text-xs font-medium">
          No {type.toLowerCase()} movements in this period
        </p>
      </div>
    );
  }

  const chartConfig: ChartConfig = {};
  categories.forEach((c, idx) => {
    chartConfig[c.category] = {
      label: c.name,
      color: c.color || PIE_PALETTE[idx % PIE_PALETTE.length],
    };
  });

  return (
    <div
      ref={containerRef}
      className={`space-y-4 ${className}`}
      onPointerDown={() => setIsTooltipOpen(true)}
      onMouseEnter={() => setIsTooltipOpen(true)}
    >
      {/* Top: Donut chart & Centered Total */}
      <div className="relative h-[200px] w-full flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className={cn(
            "h-[200px] w-full aspect-auto",
            !isTooltipOpen && "[&_.recharts-tooltip-wrapper]:!hidden"
          )}
        >
          <PieChart>
            <ChartTooltip
              trigger={tooltipTrigger}
              content={<CustomCategoryTooltip />}
            />
            <Pie
              data={categories}
              dataKey="totalAmount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              cornerRadius={4}
              onClick={(_, index) => {
                setActiveIndex(index);
                setIsTooltipOpen(true);
              }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {categories.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || PIE_PALETTE[index % PIE_PALETTE.length]}
                  opacity={
                    activeIndex === null || activeIndex === index ? 1 : 0.4
                  }
                  className="transition-all duration-200 cursor-pointer outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Center Total Summary */}
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Total {type === "EXPENSE" ? "Spent" : "Earned"}
          </span>
          <span className="text-sm font-bold font-mono text-foreground mt-0.5">
            {formatIDR(totalAmount)}
          </span>
        </div>
      </div>

      {/* Bottom: Ranked Category Progress Bars */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {categories.map((c, idx) => {
          const CatIcon = getCategoryIcon(c.icon);
          const barColor = c.color || PIE_PALETTE[idx % PIE_PALETTE.length];
          const isHovered = activeIndex === idx;

          return (
            <div
              key={c.category}
              onClick={() => {
                setActiveIndex(idx === activeIndex ? null : idx);
                setIsTooltipOpen(true);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-muted/60 shadow-xs" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex size-5 items-center justify-center rounded-md text-white shrink-0"
                    style={{ backgroundColor: barColor }}
                  >
                    <CatIcon className="size-3" />
                  </span>
                  <span className="font-medium text-foreground truncate max-w-[130px]">
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-foreground">
                    {formatIDR(c.totalAmount)}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground w-9 text-right font-medium">
                    {c.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${c.percentage}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomCategoryTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload as CategoryBreakdownItem;
  if (!item) return null;

  const CatIcon = getCategoryIcon(item.icon);

  return (
    <div className="rounded-xl border border-border/70 bg-background/95 p-2.5 text-xs shadow-xl backdrop-blur-md min-w-[160px] space-y-1 animate-in fade-in-0 zoom-in-95">
      <div className="flex items-center gap-2 border-b border-border/40 pb-1.5 font-semibold text-foreground">
        <span
          className="flex size-4 items-center justify-center rounded-full text-white shrink-0"
          style={{ backgroundColor: item.color || "#3B82F6" }}
        >
          <CatIcon className="size-2.5" />
        </span>
        <span className="truncate">{item.name}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs pt-0.5">
        <span className="text-muted-foreground">Amount:</span>
        <span className="font-mono font-bold text-foreground">
          {formatIDR(item.totalAmount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>Share:</span>
        <span className="font-mono font-bold text-primary">
          {item.percentage}% ({item.count} items)
        </span>
      </div>
    </div>
  );
}

