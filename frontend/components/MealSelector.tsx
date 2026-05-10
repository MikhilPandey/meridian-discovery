"use client";

import { useState } from "react";
import type { Meal } from "@/lib/api";

export default function MealSelector({
  meals,
  selected,
  onSelect,
}: {
  meals: Meal[];
  selected: Meal | null;
  onSelect: (m: Meal) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [c, setC] = useState(40);
  const [p, setP] = useState(15);
  const [f, setF] = useState(10);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {meals.map((m) => {
          const active = selected?.name === m.name;
          return (
            <button
              key={m.name}
              onClick={() => {
                setShowCustom(false);
                onSelect(m);
              }}
              className={`text-left p-3 rounded-xl transition-all border-2 ${
                active
                  ? "border-meridian-gold bg-white shadow-md"
                  : "border-transparent bg-white hover:border-meridian-cream"
              }`}
            >
              <div className="text-sm font-medium text-meridian-green leading-tight min-h-[2.5em]">
                {m.name}
              </div>
              <div className="mt-2 flex gap-2 text-[11px] text-meridian-muted">
                <span>C {m.carbs_g}g</span>
                <span>P {m.protein_g}g</span>
                <span>F {m.fat_g}g</span>
              </div>
              {m.region && m.region !== "universal" && (
                <div className="mt-1 text-[10px] uppercase tracking-wide text-meridian-gold">
                  {m.region}
                </div>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setShowCustom((s) => !s)}
          className={`text-left p-3 rounded-xl border-2 border-dashed transition-all ${
            showCustom
              ? "border-meridian-gold bg-white"
              : "border-meridian-cream bg-white/60 hover:border-meridian-muted"
          }`}
        >
          <div className="text-sm font-medium text-meridian-green">+ Custom Meal</div>
          <div className="mt-2 text-[11px] text-meridian-muted">Enter macros</div>
        </button>
      </div>

      {showCustom && (
        <div className="mt-4 p-4 card flex flex-wrap items-end gap-3">
          {[
            { label: "Carbs (g)", value: c, set: setC },
            { label: "Protein (g)", value: p, set: setP },
            { label: "Fat (g)", value: f, set: setF },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex flex-col text-xs text-meridian-muted">
              {label}
              <input
                type="number"
                min={0}
                max={200}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="mt-1 w-24 border border-meridian-cream rounded-lg px-2 py-1.5 text-sm text-meridian-body focus:outline-none focus:ring-2 focus:ring-meridian-gold"
              />
            </label>
          ))}
          <button
            onClick={() =>
              onSelect({ name: "Custom Meal", carbs_g: c, protein_g: p, fat_g: f })
            }
            className="ml-auto px-4 py-2 rounded-lg bg-meridian-green text-white text-sm hover:bg-meridian-green-soft"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
