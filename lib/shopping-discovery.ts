import type { Package } from './catalog';

export function searchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').trim();
}
export function matchesSearch(text: string, query: string): boolean {
  const haystack = searchText(text);
  return searchText(query).split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
}
export function relatedPackages(current: Package, items: Package[], limit = 3): Package[] {
  const ids = new Set(current.items.map(item => item.productId).filter(id => id != null));
  const overlap = (item: Package) => item.items.filter(row => row.productId != null && ids.has(row.productId)).length;
  return items.filter(item => item.id !== current.id && item.available > 0)
    .sort((a, b) => overlap(b) - overlap(a) || Math.abs(a.price - current.price) - Math.abs(b.price - current.price) || a.id - b.id)
    .slice(0, Math.max(0, limit));
}
