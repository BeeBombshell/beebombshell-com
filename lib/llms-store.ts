"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared store for opening/closing the styled plain-text llms.txt modal
 * from the notch toggle, hero badge back face, and footer.
 */

let isOpen = false;
let activeVariant: "standard" | "full" = "standard";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const llmsStore = {
  get isOpen() {
    return isOpen;
  },
  get variant() {
    return activeVariant;
  },
  open(variant: "standard" | "full" = "standard") {
    activeVariant = variant;
    if (!isOpen) {
      isOpen = true;
      notify();
    }
  },
  close() {
    if (isOpen) {
      isOpen = false;
      notify();
    }
  },
  toggle(variant: "standard" | "full" = "standard") {
    if (isOpen) {
      this.close();
    } else {
      this.open(variant);
    }
  },
  setVariant(variant: "standard" | "full") {
    if (activeVariant !== variant) {
      activeVariant = variant;
      notify();
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useLlmsStore() {
  const openState = useSyncExternalStore(
    llmsStore.subscribe,
    () => llmsStore.isOpen,
    () => false
  );

  const variantState = useSyncExternalStore(
    llmsStore.subscribe,
    () => llmsStore.variant,
    () => "standard" as "standard" | "full"
  );

  return {
    isOpen: openState,
    variant: variantState,
    open: (variant?: "standard" | "full") => llmsStore.open(variant),
    close: () => llmsStore.close(),
    toggle: (variant?: "standard" | "full") => llmsStore.toggle(variant),
    setVariant: (variant: "standard" | "full") => llmsStore.setVariant(variant),
  };
}
