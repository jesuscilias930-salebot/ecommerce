import test from 'node:test';
import assert from 'node:assert/strict';
import {cartDisplayName} from '../lib/cart-display-name.ts';
test('cart hides the assortment disclaimer without changing the product identity',()=>{
 assert.equal(cartDisplayName('Caricatura surtida según existencias · sin proporción garantizada por género o edad'),'Caricatura surtida según existencias');
 assert.equal(cartDisplayName('CALCETA DEPORTIVA UNISEX'),'CALCETA DEPORTIVA UNISEX');
 assert.equal(cartDisplayName('Caricatura surtida — sin proporción garantizada por género o edad'),'Caricatura surtida');
});
