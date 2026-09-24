/** Customer-facing name, independent of the internal volume-pricing group. */
export function productDisplayName(product: {name: string; category?: string | null; gender?: string | null}): string {
  const clean = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX');
  const gender = clean(product.gender || '');
  const label = ({HOMBRE: 'CABALLERO', MUJER: 'DAMA'} as Record<string, string>)[gender] || gender;
  let name = clean(product.name);
  const contains = (part: string) => (` ${name} `).includes(` ${part} `);
  const category = clean(product.category || '');
  if (category && !contains(category)) name = `${name} ${category}`.trim();
  if (label && !contains(label) && !contains(gender)) name = `${name} ${label}`.trim();
  return name;
}
