import { useTime } from '../../../hooks/useTime';
import { motion } from 'framer-motion';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Clock = () => {
  const time = useTime();
  
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  const ms = time.getMilliseconds();

  const secExact = s + ms / 1000;
  const minExact = m + secExact / 60;
  const hourExact = (h % 12) + minExact / 60;

  const h12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";

  // Hand Rotations
  const hourDeg = hourExact * 30;
  const minDeg = minExact * 6;
  const secDeg = secExact * 6;

  // Arc length for the outer ring
  const circumference = 2 * Math.PI * 92; // Scaled down r from 122 to 92
  const arcLen = (s / 60) * circumference;

  return (
    <div className="theme-glass p-8 flex flex-row items-center gap-10 select-none group transition-all duration-500 hover:bg-theme-glass/60">
      
      {/* Analog Clock Face (Left Side) */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
          <defs>
            <filter id="softglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Ring Progress */}
          <circle 
            cx="100" cy="100" r="92" 
            fill="none" 
            stroke="var(--theme-border)" 
            strokeWidth="1" 
          />
          <motion.circle 
            cx="100" cy="100" r="92" 
            fill="none" 
            stroke="var(--color-1)" // Using theme dynamic color
            strokeWidth="2"
            strokeLinecap="round"
            style={{ rotate: -90, originX: "100px", originY: "100px" }}
            strokeDasharray={`${arcLen} ${circumference - arcLen}`}
            className="opacity-60"
          />

          {/* Clock Face Background */}
          <circle 
            cx="100" cy="100" r="82" 
            fill="var(--theme-glass)" 
            stroke="var(--theme-border)" 
            strokeWidth="0.5" 
          />

          {/* Ticks */}
          <g>
            {[...Array(60)].map((_, i) => {
              const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
              const isHour = i % 5 === 0;
              const r1 = 82;
              const r2 = isHour ? 70 : 76;
              const x1 = 100 + r1 * Math.cos(angle);
              const y1 = 100 + r1 * Math.sin(angle);
              const x2 = 100 + r2 * Math.cos(angle);
              const y2 = 100 + r2 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  stroke={isHour ? "var(--theme-text)" : "var(--theme-muted)"}
                  strokeWidth={isHour ? "1.2" : "0.5"}
                  strokeLinecap="round"
                  className={isHour ? "opacity-60" : "opacity-30"}
                />
              );
            })}
          </g>

          {/* Hour Labels */}
          <g>
            {[12, 3, 6, 9].map((hour) => {
              const angle = (hour / 12) * 2 * Math.PI - Math.PI / 2;
              const r = 58;
              const x = 100 + r * Math.cos(angle);
              const y = 100 + r * Math.sin(angle);
              return (
                <text
                  key={hour}
                  x={x} y={y + 3}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--theme-text)"
                  className="font-sans opacity-70"
                >
                  {hour}
                </text>
              );
            })}
          </g>

          {/* Hands */}
          <motion.line 
            x1="100" y1="100" x2="100" y2="55"
            stroke="var(--theme-text)" strokeWidth="3.5" strokeLinecap="round"
            style={{ rotate: hourDeg, originX: "100px", originY: "100px" }}
          />
          <motion.line 
            x1="100" y1="100" x2="100" y2="40"
            stroke="var(--theme-text)" strokeWidth="2" strokeLinecap="round"
            style={{ rotate: minDeg, originX: "100px", originY: "100px" }}
          />
          <motion.line 
            x1="100" y1="114" x2="100" y2="35"
            stroke="var(--color-1)" strokeWidth="1" strokeLinecap="round"
            style={{ rotate: secDeg, originX: "100px", originY: "100px" }}
          />

          {/* Center Dots */}
          <motion.circle 
            cx="100" cy="100" r="3" 
            fill="var(--color-1)"
            animate={{ r: [3, 4, 3] }}
            transition={{ duration: 0.3 }}
            key={s}
          />
          <circle cx="100" cy="100" r="1.5" fill="var(--theme-contrast)" />
        </svg>
      </div>

      {/* Digital and Date Section (Right Side) */}
      <div className="flex flex-col items-start gap-4 min-w-[200px]">
        {/* Digital Section */}
        <div className="flex items-baseline gap-1">
          <div className="text-5xl font-medium text-theme-text tabular-nums tracking-tight leading-none">
            {String(h12).padStart(2, '0')}:{String(m).padStart(2, '0')}
          </div>
          <div className="text-4xl font-light text-theme-muted leading-none animate-pulse mx-0.5">:</div>
          <motion.div 
            key={s}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-normal text-theme-muted tabular-nums leading-none self-end mb-1"
          >
            {String(s).padStart(2, '0')}
          </motion.div>
          <div className="text-xs font-bold text-theme-muted uppercase tracking-widest self-end mb-1.5 ml-1">
            {ampm}
          </div>
        </div>

        {/* Date Pills (Below Digital) */}
        <div className="flex items-center gap-3">
          <DatePill label="Day" value={DAYS[time.getDay()]} />
          <DatePill label="Date" value={String(time.getDate()).padStart(2, '0')} />
          <DatePill label="Month" value={MONTHS[time.getMonth()]} />
        </div>
      </div>

    </div>
  );
};

const DatePill = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-theme-glass/20 border-[0.5px] border-theme-border rounded-xl px-3 py-1.5 flex flex-col items-center gap-0 min-w-[60px] backdrop-blur-sm">
    <span className="text-[8px] uppercase tracking-tighter text-theme-muted font-bold opacity-60">{label}</span>
    <span className="text-sm font-semibold text-theme-text">{value}</span>
  </div>
);
