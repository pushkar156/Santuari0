import React, { useState, useEffect } from 'react';
import { Battery as BatteryIcon, BatteryCharging, BatteryWarning } from 'lucide-react';
import { motion } from 'framer-motion';

export const Battery: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [charging, setCharging] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('getBattery' in navigator)) {
      setSupported(false);
      return;
    }

    let battery: any = null;

    const updateBatteryInfo = () => {
      if (battery) {
        setLevel(battery.level);
        setCharging(battery.charging);
      }
    };

    (navigator as any).getBattery().then((batt: any) => {
      battery = batt;
      updateBatteryInfo();

      battery.addEventListener('levelchange', updateBatteryInfo);
      battery.addEventListener('chargingchange', updateBatteryInfo);
    }).catch(() => {
      setSupported(false);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', updateBatteryInfo);
        battery.removeEventListener('chargingchange', updateBatteryInfo);
      }
    };
  }, []);

  if (!supported) return null;

  const percentage = Math.round(level * 100);
  
  // Custom color based on status
  const getColor = () => {
    if (charging) return '#10b981'; // Green/Emerald
    if (percentage <= 20) return '#ef4444'; // Red
    if (percentage <= 50) return '#f59e0b'; // Amber
    return 'var(--theme-text, #ffffff)';
  };

  const ringColor = getColor();
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (level * circumference);

  return (
    <div className="theme-glass p-5 rounded-3xl flex items-center justify-between gap-4 w-full max-w-[320px] transition-all duration-500 hover:bg-theme-glass/60">
      <div className="flex items-center gap-3">
        {/* Ring indicator */}
        <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="var(--theme-border)"
              strokeWidth="2"
              className="opacity-20"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={ringColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {charging ? (
              <BatteryCharging size={18} style={{ color: ringColor }} />
            ) : percentage <= 20 ? (
              <BatteryWarning size={18} style={{ color: ringColor }} className="animate-pulse" />
            ) : (
              <BatteryIcon size={18} style={{ color: ringColor }} />
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-theme-muted opacity-50">
            System Power
          </span>
          <span className="text-sm font-semibold text-theme-text leading-none mt-1">
            {charging ? 'Charging' : 'On Battery'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-2xl font-black text-theme-text tabular-nums tracking-tighter">
          {percentage}%
        </span>
        <span className="text-[8px] font-black uppercase tracking-widest text-theme-muted opacity-40 mt-1">
          Remaining
        </span>
      </div>
    </div>
  );
};
