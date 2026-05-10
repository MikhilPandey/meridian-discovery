"use client";

import { useRef, useState } from "react";

export default function FileDrop({
  label,
  hint,
  accept,
  onFile,
  done,
  doneSummary,
  error,
}: {
  label: string;
  hint: string;
  accept: string;
  onFile: (f: File) => void | Promise<void>;
  done: boolean;
  doneSummary?: string;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function pick(f: File | null) {
    if (f) onFile(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0] ?? null);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-colors ${
        drag
          ? "border-meridian-gold bg-amber-50/50"
          : done
          ? "border-emerald-300 bg-emerald-50/40"
          : error
          ? "border-rose-300 bg-rose-50/40"
          : "border-meridian-cream hover:border-meridian-muted bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
            done
              ? "bg-emerald-500 text-white"
              : "bg-meridian-cream-light text-meridian-muted"
          }`}
        >
          {done ? "✓" : "+"}
        </div>
        <div className="flex-1">
          <div className="font-medium text-meridian-green">{label}</div>
          <div className="text-xs text-meridian-muted mt-0.5">{hint}</div>
          {done && doneSummary && (
            <div className="mt-2 text-xs text-emerald-800">{doneSummary}</div>
          )}
          {error && <div className="mt-2 text-xs text-rose-700">{error}</div>}
        </div>
      </div>
    </div>
  );
}
