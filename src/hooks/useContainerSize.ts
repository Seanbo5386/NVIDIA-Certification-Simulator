import { useState, useEffect, useRef } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Hook that tracks the size of a container element using ResizeObserver.
 * Returns the current width and height, plus a ref to attach to the container.
 *
 * @param defaultWidth - Fallback width before measurement (default: 800)
 * @param aspectRatio - Height/width ratio to maintain (default: 0.667 ~ 2:3)
 */
export function useContainerSize(
  defaultWidth: number = 800,
  aspectRatio: number = 0.667,
): { containerRef: React.RefObject<HTMLDivElement>; width: number; height: number } {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [size, setSize] = useState<ContainerSize>({
    width: defaultWidth,
    height: Math.round(defaultWidth * aspectRatio),
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setSize({
            width: Math.round(width),
            height: Math.round(width * aspectRatio),
          });
        }
      }
    });

    observer.observe(element);

    // Initial measurement
    const rect = element.getBoundingClientRect();
    if (rect.width > 0) {
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.width * aspectRatio),
      });
    }

    return () => observer.disconnect();
  }, [aspectRatio]);

  return { containerRef, width: size.width, height: size.height };
}
