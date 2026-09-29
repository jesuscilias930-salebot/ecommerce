import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
// Node 24 runner: resolve the extensionless imports used by the Next bundler.
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.'))return next(specifier+'.ts',context);throw error;}}});
const {cartInput,validCartInput}=await import('../lib/cart-quote.ts');
const {completedCart}=await import('../lib/completed-cart.ts');
const selection=[{productId:1,quantity:20},{productId:2,quantity:30}];
test('cart quote and checkout retain the exact selection; shipping key changes with it',()=>{
 const old=cartInput([{id:10,quantity:2,selection}]);
 assert.deepEqual(old.bundles,[{bundleId:10,quantity:2,selection}]);assert.equal(validCartInput(old),true);
 const changed=cartInput([{id:10,quantity:2,selection:[{productId:2,quantity:50}]}]);assert.notEqual(JSON.stringify(old),JSON.stringify(changed));
 assert.equal(validCartInput({products:[],bundles:[{bundleId:10,quantity:1,selection:[]}]}),false);
});
test('receipt clears the purchased combination but never a newly edited one',()=>{
 const cart=[{id:10,quantity:1,selection}],id='abc';
 const attempt=JSON.stringify({id,body:JSON.stringify(cartInput(cart))});
 assert.deepEqual(completedCart(cart,'MS-abc',attempt),[]);
 const edited=[{id:10,quantity:1,selection:[{productId:2,quantity:50}]}];
 assert.deepEqual(completedCart(edited,'MS-abc',attempt),edited);
 assert.equal(completedCart(cart,'MS-other',attempt),null);
});
