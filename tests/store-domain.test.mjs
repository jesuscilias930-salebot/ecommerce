import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStoreDomain } from '../lib/store-domain.mjs';

const config = JSON.stringify({ 'tienda.merlyncilias.com': 'tenant-real', 'merlyncilias.com': 'tenant-real', 'otra.example.com': 'otro-tenant' });
test('registered domains and aliases resolve independently', () => {
  assert.equal(resolveStoreDomain('TIENDA.MERLYNCILIAS.COM', config), 'tenant-real');
  assert.equal(resolveStoreDomain('merlyncilias.com', config), 'tenant-real');
  assert.equal(resolveStoreDomain('otra.example.com', config), 'otro-tenant');
});
test('unknown hosts, suffix attacks, malformed hosts and missing host fail closed', () => {
  for (const host of [null, '', 'localhost:3000', 'evil.com', 'tienda.merlyncilias.com.evil.com', 'https://merlyncilias.com', 'user@merlyncilias.com', 'merlyncilias.com/path', 'merlyncilias.com,evil.com', ' merlyncilias.com', 'merlyncilias.com\r\n', 'merlyncilias.com:99999', 'merlyncilias.com:8080']) {
    assert.throws(() => resolveStoreDomain(host, config));
  }
});
test('local defaults exist only in development', () => {
  assert.equal(resolveStoreDomain('localhost:3000', undefined, true), 'tienda-local');
  assert.equal(resolveStoreDomain('127.0.0.1:3000', undefined, true), 'tienda-local');
  assert.throws(() => resolveStoreDomain('localhost:3000', undefined, false));
  assert.throws(() => resolveStoreDomain('merlyncilias.com', undefined, true));
  assert.throws(() => resolveStoreDomain('localhost:3000', config, true));
});
test('invalid maps and unsafe tenant values are rejected', () => {
  for (const value of ['{', 'null', '[]', '"tenant"', '{"merlyncilias.com":""}', '{"merlyncilias.com":"bad\\r\\nvalue"}', '{"merlyncilias.com":123}', '{"merlyncilias.com":"a","MERLYNCILIAS.COM":"b"}']) {
    assert.throws(() => resolveStoreDomain('merlyncilias.com', value));
  }
});
