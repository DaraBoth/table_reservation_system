/**
 * Custom sorting utility for TableBook OS.
 * Handles mixed Khmer and English characters/numbers with specific priority:
 * 1. Khmer Letters (ក-ៈ)
 * 2. Khmer Numbers (០-៩)
 * 3. English Letters (A-Z)
 * 4. English Numbers (0-9)
 */

export type SortableItem = {
  name: string;
  [key: string]: any;
};

/**
 * Detects the priority category of a string based on its first character.
 */
function getCategoryPriority(str: string): number {
  if (!str) return 99;
  const char = str.charAt(0);
  const code = char.charCodeAt(0);

  // 1. Khmer Letters (U+1780 to U+17D3)
  if (code >= 0x1780 && code <= 0x17D3) return 1;
  
  // 2. Khmer Numbers (U+17E0 to U+17E9)
  if (code >= 0x17E0 && code <= 0x17E9) return 2;

  // 3. English Letters (A-Z, a-z)
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) return 3;

  // 4. English Numbers (0-9)
  if (code >= 48 && code <= 57) return 4;

  // Others
  return 5;
}

const khmerCollator = new Intl.Collator('km-KH', { numeric: true, sensitivity: 'base' });
const englishCollator = new Intl.Collator('en-US', { numeric: true, sensitivity: 'base' });

/**
 * Compares two names based on the custom language priority rules.
 */
export function compareNames(a: string, b: string): number {
  const pA = getCategoryPriority(a);
  const pB = getCategoryPriority(b);

  if (pA !== pB) return pA - pB;

  // Within the same category, use appropriate collator
  if (pA <= 2) return khmerCollator.compare(a, b);
  return englishCollator.compare(a, b);
}

/**
 * Groups and sorts tables by their zones.
 */
export function groupAndSortTables<T extends { zone_id?: string | null; table_name: string; zones?: { name: string; sort_order: number } | null }>(
  tables: T[],
  zones: { id: string; name: string; sort_order: number }[]
) {
  // 1. Sort Zones first by manual sort_order, then by name
  const sortedZones = [...zones].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return compareNames(a.name, b.name);
  });

  // 2. Group tables
  const grouped: Record<string, T[]> = {};
  const unassigned: T[] = [];

  tables.forEach(table => {
    if (table.zone_id) {
      if (!grouped[table.zone_id]) grouped[table.zone_id] = [];
      grouped[table.zone_id].push(table);
    } else {
      unassigned.push(table);
    }
  });

  // 3. Sort tables within each group by table_name
  Object.keys(grouped).forEach(zoneId => {
    grouped[zoneId].sort((a, b) => compareNames(a.table_name, b.table_name));
  });
  unassigned.sort((a, b) => compareNames(a.table_name, b.table_name));

  return {
    sortedZones,
    grouped,
    unassigned
  };
}
