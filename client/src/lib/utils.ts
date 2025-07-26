import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isWebKit = /WebKit/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent);
  const isEdge = /Edge/i.test(userAgent);
  
  // Safari is WebKit but not Chrome or Edge
  return isWebKit && !isChrome && !isEdge;
}
