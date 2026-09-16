"use client";

import { useEffect, useState } from "react";

export default function StaffClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    // Avoid hydration mismatch by rendering a placeholder
    return <div className="h-10 w-24 opacity-0" aria-hidden="true" />;
  }

  const timeString = time.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    hour12: false 
  });
  
  const dateString = time.toLocaleDateString("en-GB", { 
    weekday: "short", 
    day: "numeric", 
    month: "short" 
  });

  return (
    <div className="flex flex-col items-end justify-center text-right">
      <span className="font-serif text-xl tracking-wider text-[var(--color-brand-ivory)] leading-none">
        {timeString}
      </span>
      <span className="text-[10px] text-[var(--color-brand-grey)] opacity-80 uppercase tracking-widest mt-1 hidden md:block">
        {dateString}
      </span>
    </div>
  );
}
