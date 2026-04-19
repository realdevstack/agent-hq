import { useEffect, useRef, useState } from "react";

/**
 * AnimatedNumber — renders a numeric value with a brief pulse whenever
 * the value changes. Pure CSS (class toggle) so it stays cheap across
 * many tiles and plays nicely with our live-polling data flow.
 *
 * Usage:
 *   <AnimatedNumber value={counters.replied} />
 *
 * The wrapping <span> gets .animate-count-pulse reapplied on each change
 * by cycling an animation-key. Formatting is locale-aware via toLocaleString.
 */
type Props = {
  value: number;
  className?: string;
  format?: (n: number) => string;
};

export default function AnimatedNumber({ value, className = "", format }: Props) {
  const [animKey, setAnimKey] = useState(0);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    // First render — no pulse (that'd flash every counter on page load).
    if (prevRef.current === null) {
      prevRef.current = value;
      return;
    }
    if (value !== prevRef.current) {
      prevRef.current = value;
      // Cycling the key remounts the span, restarting the CSS animation.
      setAnimKey((k) => k + 1);
    }
  }, [value]);

  const display = format ? format(value) : value.toLocaleString();

  // Only apply the pulse animation after the first real change, so initial
  // page-load doesn't flash every counter on the page.
  const animClass = animKey > 0 ? "animate-count-pulse" : "";

  return (
    <span key={animKey} className={`inline-block tabular-nums ${animClass} ${className}`}>
      {display}
    </span>
  );
}
