import test from 'node:test';
import assert from 'node:assert/strict';
import { legalBusiness, LEGAL_VERSION } from '../lib/legal.ts';
test('legal pages use the merchant-authorized address and version',()=>{
  assert.equal(legalBusiness.address,'Privada Palmira sobre avenida de los Censos, Orizaba, Veracruz.');
  assert.equal(LEGAL_VERSION,'2026-10-13');
  assert.ok(legalBusiness.name&&legalBusiness.address&&legalBusiness.privacyEmail);
});
