import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a Postgres tsrange string like '["2024-01-01 12:00:00+00", "2024-01-01 14:00:00+00")'
 * and returns the start Date.
 */
export function parseTsRange(range: any): { start: Date | null, end: Date | null } {
  if (!range || typeof range !== 'string') return { start: null, end: null }
  
  try {
    // Remove brackets, parentheses and double quotes
    const clean = range.replace(/[\[\]\(\)\"]/g, '')
    const parts = clean.split(',')
    
    const start = parts[0] ? new Date(parts[0].trim()) : null
    const end = parts[1] ? new Date(parts[1].trim()) : null
    
    return { 
      start: start && !isNaN(start.getTime()) ? start : null,
      end: end && !isNaN(end.getTime()) ? end : null
    }
  } catch (e) {
    console.error('Failed to parse tsrange:', range, e)
    return { start: null, end: null }
  }
}
