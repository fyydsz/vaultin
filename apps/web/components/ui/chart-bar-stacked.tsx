"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface StackedBarItem {
  key: string;
  label?: string;
  color?: string;
  radius?: [number, number, number, number] | number;
  stackId?: string;
}

export interface ChartBarStackedProps {
  data: Array<Record<string, any>>;
  config?: ChartConfig;
  bars?: StackedBarItem[];
  keys?: string[];
  xAxisKey?: string;
  stackId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  trendingText?: React.ReactNode;
  trendingIcon?: React.ReactNode;
  footerSubtext?: React.ReactNode;
  className?: string;
  chartClassName?: string;
  showGrid?: boolean;
  gridDashArray?: string;
  gridOpacity?: number;
  showXAxis?: boolean;
  formatXAxis?: (value: any) => string;
  showYAxis?: boolean;
  yAxisWidth?: number;
  formatYAxis?: (value: any) => string;
  showTooltip?: boolean;
  hideTooltipLabel?: boolean;
  tooltipTrigger?: "hover" | "click";
  tooltipCursor?: any;
  customTooltipContent?: React.ReactElement;
  customTooltipFormatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown
  ) => React.ReactNode;
  showLegend?: boolean;
  customLegendContent?: React.ReactElement;
  showCard?: boolean;
  scrollable?: boolean;
  minWidth?: string | number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  accessibilityLayer?: boolean;
}

export function ChartBarStacked({
  data = [],
  config,
  bars,
  keys,
  xAxisKey = "month",
  stackId = "a",
  title,
  description,
  footer,
  trendingText,
  trendingIcon,
  footerSubtext,
  className,
  chartClassName,
  showGrid = true,
  gridDashArray,
  gridOpacity,
  showXAxis = true,
  formatXAxis,
  showYAxis = false,
  yAxisWidth = 32,
  formatYAxis,
  showTooltip = true,
  hideTooltipLabel = false,
  tooltipTrigger,
  tooltipCursor = false,
  customTooltipContent,
  customTooltipFormatter,
  showLegend = true,
  customLegendContent,
  showCard = true,
  scrollable = true,
  minWidth,
  margin = { left: -4, right: 8, top: 12, bottom: 4 },
  accessibilityLayer = false,
}: ChartBarStackedProps) {
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

  const resolvedTooltipTrigger: "hover" | "click" =
    tooltipTrigger ?? (isTouchDevice ? "click" : "hover");

  // Dismiss active tooltip when clicking / tapping anywhere outside the chart without remounting
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

  // Resolve bar configuration
  const resolvedBars: StackedBarItem[] = React.useMemo(() => {
    if (bars && bars.length > 0) return bars;
    if (keys && keys.length > 0) {
      return keys.map((key, i) => ({
        key,
        label: config?.[key]?.label?.toString() || key,
        color: config?.[key]?.color || `var(--chart-${(i % 5) + 1})`,
        stackId,
      }));
    }
    if (config) {
      return Object.keys(config).map((key, i) => ({
        key,
        label: config[key]?.label?.toString() || key,
        color: config[key]?.color || `var(--chart-${(i % 5) + 1})`,
        stackId,
      }));
    }
    return [];
  }, [bars, keys, config, stackId]);

  // Construct chartConfig if not provided
  const resolvedConfig: ChartConfig = React.useMemo(() => {
    if (config) return config;
    const generated: ChartConfig = {};
    resolvedBars.forEach((bar, i) => {
      generated[bar.key] = {
        label: bar.label || bar.key,
        color: bar.color || `var(--chart-${(i % 5) + 1})`,
      };
    });
    return generated;
  }, [config, resolvedBars]);

  const minWidthStyle = typeof minWidth === "number" ? { minWidth: `${minWidth}px` } : undefined;
  const minWidthClass = typeof minWidth === "string" ? minWidth : "";

  const chartElement = (
    <div className="w-full space-y-2.5">
      <div
        ref={containerRef}
        className="w-full"
        onPointerDown={() => setIsTooltipOpen(true)}
        onMouseEnter={() => setIsTooltipOpen(true)}
      >
        <div className={cn("w-full", scrollable && "overflow-x-auto")}>
          <div
            className={cn("w-full", minWidthClass)}
            style={minWidthStyle}
          >
            <ChartContainer
              config={resolvedConfig}
              className={cn(
                "w-full aspect-auto",
                !isTooltipOpen && "[&_.recharts-tooltip-wrapper]:!hidden",
                chartClassName
              )}
            >
              <BarChart
                accessibilityLayer={accessibilityLayer}
                data={data}
                margin={margin}
              >
                {showGrid && (
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray={gridDashArray}
                    opacity={gridOpacity}
                  />
                )}
                {showXAxis && (
                  <XAxis
                    dataKey={xAxisKey}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatXAxis}
                    fontSize={11}
                  />
                )}
                {showYAxis && (
                  <YAxis
                    width={yAxisWidth}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tickFormatter={formatYAxis}
                    fontSize={11}
                  />
                )}
                {showTooltip && (
                  customTooltipContent ? (
                    <ChartTooltip
                      trigger={resolvedTooltipTrigger}
                      cursor={false}
                      content={customTooltipContent}
                    />
                  ) : (
                    <ChartTooltip
                      trigger={resolvedTooltipTrigger}
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel={hideTooltipLabel}
                          formatter={customTooltipFormatter}
                        />
                      }
                    />
                  )
                )}
                {resolvedBars.map((bar, index) => {
                  const barColor = bar.color || `var(--color-${bar.key})`;
                  const isFirst = index === 0;
                  const isLast = index === resolvedBars.length - 1;
                  const defaultRadius: [number, number, number, number] =
                    resolvedBars.length === 1
                      ? [4, 4, 4, 4]
                      : isFirst
                      ? [0, 0, 4, 4]
                      : isLast
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0];

                  return (
                    <Bar
                      key={bar.key}
                      dataKey={bar.key}
                      name={resolvedConfig[bar.key]?.label?.toString() || bar.key}
                      stackId={bar.stackId ?? stackId}
                      fill={barColor}
                      radius={bar.radius ?? defaultRadius}
                      isAnimationActive={false}
                      activeBar={(props: any) => {
                        const { x, y, width, height, fill } = props;
                        if (!width || !height || height <= 0) return null;
                        return (
                          <Rectangle
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={fill}
                            stroke={isTooltipOpen ? "#ffffff" : "none"}
                            strokeWidth={isTooltipOpen ? 2 : 0}
                            radius={bar.radius ?? defaultRadius}
                          />
                        );
                      }}
                    />
                  );
                })}
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="flex items-center justify-center pt-0.5">
          {customLegendContent || (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              {resolvedBars.map((bar) => {
                const color = bar.color || `var(--color-${bar.key})`;
                const label = resolvedConfig[bar.key]?.label?.toString() || bar.label || bar.key;
                return (
                  <div key={bar.key} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground text-xs">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return <div className={className}>{chartElement}</div>;
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="pt-2">
        {chartElement}
      </CardContent>
      {(footer || trendingText || footerSubtext) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {trendingText && (
            <div className="flex items-center gap-2 leading-none font-medium">
              {trendingText}
              {trendingIcon}
            </div>
          )}
          {footerSubtext && (
            <div className="leading-none text-muted-foreground text-xs">
              {footerSubtext}
            </div>
          )}
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

