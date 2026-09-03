import { useEffect, useRef, useState } from "react";

export function RestTimer({
  seconds,
  onDone,
  onSkip,
}: {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setLeft(seconds);
    const started = Date.now();
    const tick = setInterval(() => {
      const remaining = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        navigator.vibrate?.(200);
        doneRef.current();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [seconds]);

  const pct = seconds > 0 ? ((seconds - left) / seconds) * 100 : 100;

  return (
    <div className="card flex flex-col items-center gap-4 p-6">
      <p className="label">Rest</p>
      <div className="text-5xl font-bold tabular-nums">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-indigo-500 transition-[width] duration-300 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <button className="btn-ghost w-full" onClick={onSkip}>
        Skip rest
      </button>
    </div>
  );
}
