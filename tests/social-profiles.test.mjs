import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {socialProfiles} from '../lib/social-profiles.ts';
test('profiles use the three merchant destinations without referral or tracking parameters',()=>{
 assert.deepEqual(socialProfiles.map(p=>p.href),['https://www.instagram.com/merlyn_cilias/','https://www.facebook.com/share/1DJZ1BiW3y/','https://www.tiktok.com/@jmerlyn_cilias']);
 assert.equal(new Set(socialProfiles.map(p=>p.id)).size,3);
 for(const profile of socialProfiles){
  const url=new URL(profile.href);assert.equal(url.protocol,'https:');assert.equal(url.search,'');assert.equal(url.hash,'');assert.equal(url.username,'');
 }
});
test('global footer keeps purchase policies and uses named accessible links, not external embeds',()=>{
 const footer=readFileSync(new URL('../components/site-footer.tsx',import.meta.url),'utf8');
 const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
 assert.match(layout,/<SiteFooter\/>/);
 assert.match(footer,/legalLinks\.map/);
 assert.match(footer,/<SocialIcon id=\{profile.id\}\/\><span>\{profile.name\}<\/span>/);
 assert.match(footer,/target="_blank" rel="noopener noreferrer"/);
 assert.match(footer,/aria-label="Redes sociales de Merlyn"/);
 assert.doesNotMatch(footer,/<iframe|<script|fetch\(|useEffect/);
});
