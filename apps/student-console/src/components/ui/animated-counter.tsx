"use client";

import React, { useEffect, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  textColor?: string;
}

export function AnimatedCounter({
  target,
  label,
  prefix = "",
  suffix = "",
  textColor = "text-purple-300",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = 2000;
    const step = target / (interval / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-4xl font-bold mb-2 font-mono">
        <span className={textColor}>{prefix}</span>
        <span className={textColor}>{count}</span>
        <span className={textColor}>{suffix}</span>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
