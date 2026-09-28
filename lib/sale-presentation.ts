type Item = {name: string; category?: string | null};
const normalized = (item: Item) => `${item.name} ${item.category || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const isShort = (item: Item) => /\bshorts?\b/.test(normalized(item));
// These sock families are sold as three-pair sets; caricatura/económicos are not.
export const usesTripares = (item: Item) => !isShort(item) && /deport|licra|afelp/.test(normalized(item));
export function triparesLabel(pairs: number): string {
  const sets = Math.floor(pairs / 3);
  const remainder = pairs % 3;
  return [sets > 0 ? `${sets} ${sets === 1 ? 'tripar' : 'tripares'}` : '', remainder > 0 ? `${remainder} ${remainder === 1 ? 'par suelto' : 'pares sueltos'}` : ''].filter(Boolean).join(' + ');
}
export function bundlePresentation(parts: {quantity: number; tripares: boolean}[]): string | null {
  if (!parts.length || !parts.every(part => part.tripares)) return null;
  // Do not assemble a tripar out of leftovers belonging to different products.
  const sets = parts.reduce((sum, part) => sum + Math.floor(part.quantity / 3), 0);
  const loose = parts.reduce((sum, part) => sum + part.quantity % 3, 0);
  return [sets ? `${sets} ${sets === 1 ? 'tripar' : 'tripares'}` : '', loose ? `${loose} ${loose === 1 ? 'par suelto' : 'pares sueltos'}` : ''].filter(Boolean).join(' + ') || null;
}
