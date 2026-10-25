import test from 'node:test';
import assert from 'node:assert/strict';
import { groupByCategory } from '../lib/product-categories.ts';

test('junta categorías con la misma sección y respeta el orden configurado', () => {
  const groups = groupByCategory([
    { id: 1, category: 'Tines', categoryId: 7 },
    { id: 2, category: 'Essentials', categoryId: 5, section: 'Essentials', sectionOrder: 1 },
    { id: 3, category: 'Essentials High Quality', categoryId: 6, section: 'essentials', sectionOrder: 0 },
    { id: 4, category: 'Caricatura', categoryId: 1, sectionOrder: null },
    { id: 5 },
  ]);
  assert.deepEqual(groups.map(group => [group.label, group.products.map(product => product.id)]), [
    ['Caricatura', [4]], ['Essentials', [2, 3]], ['Tines', [1]], ['Otros productos', [5]],
  ]);
  const ordered = groupByCategory([{ id: 1, category: 'Tines', categoryId: 7, section: 'Tines', sectionOrder: 0 }, { id: 2, category: 'Caricatura', categoryId: 1, section: 'Caricatura', sectionOrder: 2 }]);
  assert.deepEqual(ordered.map(group => group.label), ['Tines', 'Caricatura']);
});
