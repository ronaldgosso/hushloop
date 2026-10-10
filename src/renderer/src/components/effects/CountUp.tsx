import { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 0.8,
  className = '',
  suffix = '',
}: CountUpProps) {
  const [current, setCurrent] = useState(from);
  const startRef = useRef(from);
  const targetRef = useRef(to);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = current;
    targetRef.current = to;
    startTimeRef.current = null;

    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startRef.current + (targetRef.current - startRef.current) * ease);
      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [to, duration]);

  return (
    <span className={`countup-num ${className}`}>
      {current}
      {suffix}
    </span>
  );
}
