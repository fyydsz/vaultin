"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { mobileNavItems } from "@/components/mobile-nav";

interface MobileSwipeProviderProps {
  children: React.ReactNode;
}

export function MobileSwipeProvider({ children }: MobileSwipeProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    isIgnored: boolean;
  } | null>(null);

  // Find current index in mobile nav list
  const getCurrentIndex = useCallback(() => {
    return mobileNavItems.findIndex((item) => {
      if (item.url === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname === item.url || pathname.startsWith(item.url + "/");
    });
  }, [pathname]);

  const currentIndex = getCurrentIndex();

  // Prefetch adjacent routes for instant transitions
  useEffect(() => {
    if (currentIndex === -1) return;

    if (currentIndex > 0) {
      router.prefetch(mobileNavItems[currentIndex - 1].url);
    }
    if (currentIndex < mobileNavItems.length - 1) {
      router.prefetch(mobileNavItems[currentIndex + 1].url);
    }
  }, [currentIndex, router]);

  // Check if target is inside an element that should not trigger page swipe (inputs, horizontal scrolls, etc.)
  const shouldIgnoreSwipe = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;

    // Ignore form inputs, sliders, and buttons
    const interactiveTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
    if (interactiveTags.includes(target.tagName)) return true;

    // Check ancestors for data-no-swipe or horizontal scroll
    let current: HTMLElement | null = target;
    while (current && current !== document.body) {
      if (current.dataset.noSwipe === "true" || current.classList.contains("no-swipe")) {
        return true;
      }
      
      // If the element itself is horizontally scrollable and currently scrolled
      const style = window.getComputedStyle(current);
      const isScrollableX = style.overflowX === "auto" || style.overflowX === "scroll";
      if (isScrollableX && current.scrollWidth > current.clientWidth) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only handle single touch on mobile screens (< 768px)
    if (window.innerWidth >= 768 || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const isIgnored = shouldIgnoreSwipe(e.target);

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isIgnored,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || touchStartRef.current.isIgnored) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Validation thresholds
    const minDistance = 50; // Minimum px to count as swipe
    const maxTime = 600; // Max duration (ms) for gesture
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Ensure it's a dominantly horizontal swipe, not vertical scroll
    if (absX < minDistance || absX < absY * 1.3 || deltaTime > maxTime) {
      return;
    }

    const activeIdx = getCurrentIndex();
    if (activeIdx === -1) return;

    // Swipe Left (Gesture Right to Left: deltaX < 0) -> Next Tab
    if (deltaX < 0 && activeIdx < mobileNavItems.length - 1) {
      const nextRoute = mobileNavItems[activeIdx + 1].url;
      router.push(nextRoute);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {}
      }
    }
    // Swipe Right (Gesture Left to Right: deltaX > 0) -> Previous Tab
    else if (deltaX > 0 && activeIdx > 0) {
      const prevRoute = mobileNavItems[activeIdx - 1].url;
      router.push(prevRoute);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {}
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-1 flex-col min-h-0 w-full touch-pan-y"
    >
      {children}
    </div>
  );
}
