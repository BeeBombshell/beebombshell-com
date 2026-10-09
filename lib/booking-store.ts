"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared booking store for opening/closing the booking popover from
 * the notch calendar icon and the badge's back face.
 */

let isOpen = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const bookingStore = {
  get isOpen() {
    return isOpen;
  },
  open() {
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
  toggle() {
    isOpen = !isOpen;
    notify();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useBookingStore() {
  const openState = useSyncExternalStore(
    bookingStore.subscribe,
    () => bookingStore.isOpen,
    () => false
  );

  return {
    isOpen: openState,
    open: bookingStore.open,
    close: bookingStore.close,
    toggle: bookingStore.toggle,
  };
}
