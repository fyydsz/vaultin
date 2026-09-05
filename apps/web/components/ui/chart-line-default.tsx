"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface ChartLineDefaultProps {
  data: Array<Record<string, any>>;
  config?: ChartConfig;
  dataKey?: string;
  xAxisKey?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  trendingText?: React.ReactNode;
  trendingIcon?: React.ReactNode;
  footerSubtext?: React.ReactNode;
  className?: string;
  chartClassName?: string;
  lineType?: "natural" | "linear" | "monotone" | "step" | "stepBefore" | "stepAfter" | "basis";
  strokeColor?: string;
  strokeWidth?: number;
  showDots?: boolean;
  dotSize?: number;
  activeDotSize?: number;
  dot?: any;
  activeDot?: any;
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
  showCard?: boolean;
  scrollable?: boolean;
  minWidth?: number | string;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  accessibilityLayer?: boolean;
}

export function ChartLineDefault({
  data = [],
  config,
  dataKey = "desktop",
  xAxisKey = "month",
  title,
  description,
  footer,
  trendingText,
  trendingIcon,
  footerSubtext,
  className,
  chartClassName,
  lineType = "monotone",
  strokeColor,
  strokeWidth = 2,
  showDots = false,
  dotSize = 3,
  activeDotSize = 5,
  dot,
  activeDot,
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
  showCard = true,
  scrollable,
  minWidth,
  margin = { left: 12, right: 12, top: 8, bottom: 8 },
  accessibilityLayer = false,
}: ChartLineDefaultProps) {
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

  const isScrollable = scrollable ?? (minWidth !== undefined);

  const chartConfig: ChartConfig = React.useMemo(() => {
    if (config) return config;
    return {
      [dataKey]: {
        label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
        color: strokeColor || "var(--chart-1)",
      },
    };
  }, [config, dataKey, strokeColor]);

  const resolvedStroke = strokeColor || `var(--color-${dataKey})`;

  const resolvedDot = React.useMemo(() => {
    if (dot !== undefined) return dot;
    if (showDots) {
      return { r: dotSize, fill: strokeColor || `var(--color-${dataKey})` };
    }
    return false;
  }, [dot, showDots, dotSize, strokeColor, dataKey]);

  const resolvedActiveDot = React.useMemo(() => {
    if (activeDot !== undefined) return activeDot;
    return {
      r: activeDotSize || 5,
      fill: resolvedStroke,
      stroke: "#ffffff",
      strokeWidth: 2,
    };
  }, [activeDot, activeDotSize, resolvedStroke]);

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
        <div className={cn("w-full", isScrollable && "overflow-x-auto")}>
          <div
            className={cn("w-full", minWidthClass)}
            style={minWidthStyle}
          >
            <ChartContainer
              config={chartConfig}
              className={cn(
                "w-full aspect-auto",
                !isTooltipOpen && "[&_.recharts-tooltip-wrapper]:!hidden",
                chartClassName
              )}
            >
              <LineChart
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
                <Line
                  dataKey={dataKey}
                  name={chartConfig[dataKey]?.label?.toString() || dataKey}
                  type={lineType}
                  stroke={resolvedStroke}
                  strokeWidth={strokeWidth}
                  dot={resolvedDot}
                  activeDot={isTooltipOpen ? resolvedActiveDot : false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </div>
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