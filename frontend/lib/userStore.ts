"use client";

/**
 * In-memory store for the user's uploaded data.
 *
 * Privacy: data lives in module-scoped state. There is no persistence —
 * a page reload wipes it. We deliberately do NOT use localStorage,
 * sessionStorage, cookies, or IndexedDB.
 */

import { useSyncExternalStore } from "react";
import type { CgmStats } from "./cgmParser";

export type UserData = {
  genotypes: Record<string, string>;
  rsids: Record<string, string>;
  rawCalls: Record<string, string>;
  cgmStats: CgmStats | null;
  age: number | null;
  sex: string | null;
  uploadedAt: number;
};

let state: UserData | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setUserData(d: UserData | null) {
  state = d;
  emit();
}

export function getUserData(): UserData | null {
  return state;
}

export function clearUserData() {
  state = null;
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useUserData(): UserData | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null
  );
}
