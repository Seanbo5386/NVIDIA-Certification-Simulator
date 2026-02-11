import { useState, useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useFocusTrap } from "../hooks/useFocusTrap";
import type { TourStep } from "../data/tourSteps";

interface SpotlightTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_GAP = 12;
const TRANSITION_MS = 300;

/**
 * Compute tooltip position adjacent to the target, clamped to viewport.
 */
function computeTooltipPosition(
  target: TargetRect,
  placement: TourStep["placement"],
  tooltipHeight: number,
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  const padded = {
    top: target.top - PADDING,
    left: target.left - PADDING,
    width: target.width + PADDING * 2,
    height: target.height + PADDING * 2,
  };

  switch (placement) {
    case "bottom":
      top = padded.top + padded.height + TOOLTIP_GAP;
      left = padded.left + padded.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "top":
      top = padded.top - TOOLTIP_GAP - tooltipHeight;
      left = padded.left + padded.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case "right":
      top = padded.top + padded.height / 2 - tooltipHeight / 2;
      left = padded.left + padded.width + TOOLTIP_GAP;
      break;
    case "left":
      top = padded.top + padded.height / 2 - tooltipHeight / 2;
      left = padded.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
      break;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - tooltipHeight - 8));

  return { top, left };
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  steps,
  onComplete,
}) => {
  const reducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, {
    isActive: true,
    onEscape: onComplete,
  });

  const currentStep = steps[currentIndex];

  // Find target element and track its position
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.selector);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [currentStep]);

  // On step change: scroll target into view, then measure
  useEffect(() => {
    if (!currentStep) return;

    setTooltipVisible(false);

    const el = document.querySelector(currentStep.selector);
    if (el) {
      el.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    // Allow scroll to settle before measuring
    const timer = setTimeout(
      () => {
        updateTargetRect();
        setTooltipVisible(true);
      },
      reducedMotion ? 0 : TRANSITION_MS,
    );

    return () => clearTimeout(timer);
  }, [currentIndex, currentStep, reducedMotion, updateTargetRect]);

  // ResizeObserver + scroll/resize listeners to keep cutout positioned
  useEffect(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.selector);

    let observer: ResizeObserver | null = null;
    if (el) {
      observer = new ResizeObserver(updateTargetRect);
      observer.observe(el);
    }

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [currentStep, updateTargetRect]);

  // Skip steps whose target element is not found
  useEffect(() => {
    if (!currentStep) return;
    if (targetRect !== null) return; // target found, nothing to skip

    // Wait a moment for DOM to render
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.selector);
      if (!el) {
        // Skip this step
        if (currentIndex < steps.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          onComplete();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, targetRect, currentIndex, steps.length, onComplete]);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  const isLastStep = currentIndex === steps.length - 1;

  // Compute tooltip position
  const tooltipHeight = tooltipRef.current?.offsetHeight ?? 160;
  const tooltipPos = targetRect
    ? computeTooltipPosition(targetRect, currentStep.placement, tooltipHeight)
    : {
        top: window.innerHeight / 2 - 80,
        left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2,
      };

  const transitionStyle = reducedMotion
    ? "none"
    : `all ${TRANSITION_MS}ms ease`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Guided tour"
      data-testid="spotlight-tour"
    >
      {/* Cutout overlay */}
      {targetRect ? (
        <div
          className="absolute rounded-lg pointer-events-none"
          data-testid="spotlight-cutout"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
            transition: transitionStyle,
          }}
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        />
      )}

      {/* Click-blocker behind tooltip (covers whole screen) */}
      <div
        className="absolute inset-0"
        onClick={onComplete}
        aria-hidden="true"
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute bg-gray-900 border border-gray-700 border-l-4 border-l-nvidia-green rounded-lg shadow-xl p-4"
        style={{
          width: TOOLTIP_WIDTH,
          top: tooltipPos.top,
          left: tooltipPos.left,
          opacity: tooltipVisible ? 1 : 0,
          transition: reducedMotion
            ? "none"
            : `opacity ${TRANSITION_MS}ms ease, top ${TRANSITION_MS}ms ease, left ${TRANSITION_MS}ms ease`,
        }}
        data-testid="spotlight-tooltip"
      >
        {/* Step counter */}
        <div className="text-xs font-semibold text-nvidia-green mb-2">
          Step {currentIndex + 1} of {steps.length}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-1">
          {currentStep?.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          {currentStep?.description}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={onComplete}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-2 py-1"
            data-testid="tour-skip-btn"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="bg-nvidia-green hover:bg-nvidia-darkgreen text-black text-sm font-medium px-4 py-1.5 rounded transition-colors"
            data-testid="tour-next-btn"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotlightTour;
