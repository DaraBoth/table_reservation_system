import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns up to `count` grapheme clusters from `text` for use as avatar
 * initials, uppercased where the script has letter casing (Latin, Cyrillic,
 * etc.) — toUpperCase() is a harmless no-op for scripts without casing
 * (Khmer, Chinese, Korean), so it's safe to always apply.
 *
 * Uses Intl.Segmenter for grapheme-cluster-aware slicing so combining marks
 * (e.g. Khmer consonant shifters/subscripts) don't get split apart — a plain
 * string.slice()/substring() operates on UTF-16 code units and can cut a
 * multi-part grapheme cluster in half, producing a broken/malformed glyph.
 */
export function getInitials(text: string, count = 2): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const graphemes = Array.from(segmenter.segment(trimmed), (s) => s.segment)
    return graphemes.slice(0, count).join('').toUpperCase()
  }

  // Fallback for environments without Intl.Segmenter: iterate by Unicode
  // code point (Array.from on a string) rather than raw UTF-16 code units —
  // still not fully grapheme-cluster-safe, but a meaningful improvement over
  // a plain slice() for the common case of astral-plane characters.
  return Array.from(trimmed).slice(0, count).join('').toUpperCase()
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
