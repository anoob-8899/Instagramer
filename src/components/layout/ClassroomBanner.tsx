"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Cpu } from "lucide-react";

export const ClassroomBanner: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/security/public-status");
      if (res.ok) {
        const data = await res.json();
        setActive(Boolean(data.classroomModeEnabled));
      }
    } catch {
      setActive(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-amber-950 font-mono text-xs font-bold py-2 px-4 flex items-center justify-center gap-3 shadow-md tracking-wider border-b border-amber-400 uppercase shrink-0">
      <ShieldAlert className="h-4 w-4 animate-bounce shrink-0 text-amber-950" />
      <span className="truncate">AUTHORIZED CLASSROOM SECURITY DEMONSTRATION</span>
      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-amber-950/20 px-2 py-0.5 rounded border border-amber-950/30">
        <Cpu className="h-3 w-3" /> DEMO MODE ACTIVE
      </span>
    </div>
  );
};
