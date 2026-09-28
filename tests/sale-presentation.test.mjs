import test from 'node:test';
import assert from 'node:assert/strict';
import { usesTripares, triparesLabel, bundlePresentation } from '../lib/sale-presentation.ts';

test('solo las familias vendidas en tripares usan la equivalencia', () => {
  for (const name of ['Tin deportivo', 'CALCETA DEPORTIVA', 'Tin de licra', 'Tin afelpado']) assert.equal(usesTripares({name}), true);
  assert.equal(usesTripares({name:'TIN', category:'DEPORTIVAS'}), true);
  for (const name of ['Calceta caricatura', 'Tin económico', 'Short deportivo']) assert.equal(usesTripares({name}), false);
});
test('150 pares equivalen a 50 tripares y dos cajas a 100', () => {
  assert.equal(triparesLabel(150), '50 tripares');
  assert.equal(triparesLabel(300), '100 tripares');
  assert.equal(triparesLabel(3), '1 tripar');
  assert.equal(triparesLabel(151), '50 tripares + 1 par suelto');
});
test('totales mixtos no convierten shorts ni caricatura en tripares', () => {
  assert.equal(bundlePresentation([{quantity:150,tripares:true},{quantity:150,tripares:true}]), '100 tripares');
  assert.equal(bundlePresentation([{quantity:150,tripares:true},{quantity:10,tripares:false}]), null);
  assert.equal(bundlePresentation([{quantity:4,tripares:true},{quantity:5,tripares:true}]), '2 tripares + 3 pares sueltos');
  assert.equal(bundlePresentation([]), null);
});
