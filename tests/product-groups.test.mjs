import test from 'node:test';
import assert from 'node:assert/strict';
import {groupProducts,optionsFor,reconcile,resolveVariant,genderLabel} from '../lib/product-groups.ts';

const p=(id,extra)=>({id,name:'Calcetín caricatura',category:'Caricatura',categoryId:1,currentStock:100,rules:[],...extra});
const products=[
 p(1,{gender:'Mujer',size:'22-25'}),p(2,{gender:'Hombre',size:'25-28'}),p(3,{gender:'Niño',size:'18-21',currentStock:0}),p(4,{gender:'Niña',size:'18-21'}),
 {id:10,name:'Essential High Quality',model:'Essential High Quality',color:'Negro',gender:'Hombre',size:'25-28',category:'Básicos',categoryId:2,currentStock:40,rules:[]},
 {id:11,name:'Essential High Quality',model:'Essential High Quality',color:'Blanco',gender:'Hombre',size:'25-28',category:'Básicos',categoryId:2,currentStock:0,rules:[]},
 {id:12,name:'Essential High Quality',model:'essential high quality',color:'Blanco',gender:'Mujer',size:'22-25',category:'Básicos',categoryId:2,currentStock:12,rules:[]},
 {id:20,name:'Tin liso',category:'Básicos',categoryId:2,gender:'Unisex',size:'Unitalla',currentStock:5,rules:[]},
];

test('agrupa por categoría y por modelo, con las dimensiones que cambian', () => {
 const groups=groupProducts(products);
 assert.deepEqual(groups.map(g=>[g.title,g.products.length,g.dimensions.join(',')]),[
  ['Caricatura',4,'gender,size'],['Essential High Quality',3,'gender,color,size'],['Básicos',1,''],
 ]);
 assert.equal(genderLabel('Hombre'),'Caballero'); assert.equal(genderLabel('Mujer'),'Dama'); assert.equal(genderLabel('Bebé niña'),'Bebé niña');
});

test('opciones en cascada según disponibilidad, como en Amazon', () => {
 const [caricatura,essential]=groupProducts(products);
 assert.deepEqual(optionsFor(caricatura,'gender',{}).map(o=>[o.label,o.available]),[['Dama',true],['Caballero',true],['Niña',true],['Niño',false]]);
 // La talla depende del género elegido: en Dama solo hay una.
 assert.deepEqual(optionsFor(caricatura,'size',{gender:'Dama',size:'25-28'}).map(o=>o.label),['22-25']);
 // Caballero existe en negro y en blanco (agotado); Dama solo en blanco.
 assert.deepEqual(optionsFor(essential,'color',{gender:'Caballero'}).map(o=>[o.label,o.available]),[['Blanco',false],['Negro',true]]);
 assert.deepEqual(optionsFor(essential,'color',{gender:'Dama'}).map(o=>[o.label,o.available]),[['Blanco',true]]);
 // Cambiar a Dama ajusta color y talla a lo que sí hay.
 const choice=reconcile(essential,{gender:'Dama',color:'Negro',size:'25-28'},'gender');
 assert.deepEqual(choice,{gender:'Dama',color:'Blanco',size:'22-25'});
 assert.equal(resolveVariant(essential,choice).id,12);
 assert.deepEqual(reconcile(essential,{}),{gender:'Dama',color:'Blanco',size:'22-25'});
 // Elegir un color agotado lo respeta (se muestra agotado) y completa la talla.
 assert.deepEqual(reconcile(essential,{gender:'Caballero',color:'Blanco'},'color'),{gender:'Caballero',color:'Blanco',size:'25-28'});
 assert.equal(resolveVariant(essential,{gender:'Caballero',color:'Blanco',size:'25-28'}).id,11);
 assert.equal(resolveVariant(caricatura,reconcile(caricatura,{gender:'Dama'},'gender')).id,1);
});

test('si dos productos coinciden en todo, se elige también el modelo', () => {
 const twins=[p(1,{name:'Caricatura A',gender:'Mujer'}),p(2,{name:'Caricatura B',gender:'Mujer'})];
 const [group]=groupProducts(twins);
 assert.deepEqual(group.dimensions,['name']);
 assert.equal(resolveVariant(group,{name:'Caricatura B'}).id,2);
});
