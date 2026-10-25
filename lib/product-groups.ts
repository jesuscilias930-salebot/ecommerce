// Agrupa productos en una sola ficha (como Amazon o Mercado Libre): la gente elige
// género, color y talla en lugar de ver un producto por cada variante.
//  - Con modelo (guardado en MerlynSeller): un grupo por modelo, p. ej. «Essential High Quality».
//  - Sin modelo: un grupo por categoría, p. ej. «Caricatura» con dama, caballero, niño…
// Este módulo no importa otros para poder probarlo directamente con Node.
import type {Original} from './product-catalog';

export type Dimension='gender'|'color'|'size'|'name';
export type Choice=Partial<Record<Dimension,string>>;
export type ProductGroup<P extends Original=Original>={key:string;title:string;category:string;categoryId:number|null;section?:string|null;sectionOrder?:number|null;byModel:boolean;products:P[];dimensions:Dimension[]};
export type Option={value:string;label:string;available:boolean;stock:number};

const clean=(value?:string|null)=>(value||'').trim().replace(/\s+/g,' ');
const fold=(value?:string|null)=>clean(value).normalize('NFD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase('es-MX');
const GENDERS:Record<string,string>={hombre:'Caballero',caballero:'Caballero',male:'Caballero',mujer:'Dama',dama:'Dama',female:'Dama',unisex:'Unisex',nino:'Niño',nina:'Niña',kids:'Niño','bebe nino':'Bebé niño','bebe nina':'Bebé niña',bebe:'Bebé',infantil:'Infantil'};
const GENDER_ORDER=['Dama','Caballero','Unisex','Niña','Niño','Infantil','Bebé niña','Bebé niño','Bebé'];
/** Etiqueta de género para el cliente: Hombre → Caballero, Mujer → Dama. */
export const genderLabel=(gender?:string|null)=>GENDERS[fold(gender)]||clean(gender);
// Colores que se reconocen en el nombre cuando MerlynSeller no envía el color.
// Primero las frases de dos palabras para no confundir «azul marino» con «azul».
const COLOR_WORDS=['azul marino','azul cielo','verde militar','gris jaspe','gris oxford','rosa pastel','negro','negra','blanco','blanca','gris','azul','marino','rojo','roja','rosa','fucsia','morado','morada','lila','verde','amarillo','amarilla','naranja','cafe','café','beige','crema','hueso','vino','guinda','mostaza','turquesa','coral','plata','dorado','dorada','multicolor','surtido','surtidos'];
const title=(value:string)=>value.charAt(0).toLocaleUpperCase('es-MX')+value.slice(1);
/** Color del nombre: «… CABALLERO NEGRO» → «Negro»; «Hoodie (Beige)» → «Beige». */
export function colorFromName(name?:string|null):string{
 const text=` ${fold(name).replace(/[()·,/-]/g,' ').replace(/\s+/g,' ')} `;
 const found=COLOR_WORDS.find(word=>text.includes(` ${fold(word)} `));
 return found?title(found.replace(/^cafe$/,'café')):'';
}
/** Color del producto: el de MerlynSeller y, si no hay, el que diga su nombre. */
export const productColor=(product:Original)=>clean(product.color)||colorFromName(product.name);
const valueOf=(product:Original,dimension:Dimension)=>dimension==='gender'?genderLabel(product.gender):dimension==='color'?productColor(product):dimension==='size'?clean(product.details?.sizeRange||product.size):clean(product.name);
const naturalDesc=(a:string,b:string)=>b.localeCompare(a,'es',{numeric:true,sensitivity:'base'});
const order=(dimension:Dimension,values:string[])=>dimension==='gender'
 ?[...values].sort((a,b)=>(GENDER_ORDER.indexOf(a)+1||99)-(GENDER_ORDER.indexOf(b)+1||99)||a.localeCompare(b,'es'))
 :dimension==='size'?[...values].sort(naturalDesc):[...values].sort((a,b)=>a.localeCompare(b,'es'));

/** Agrupa por modelo y, si no hay, por categoría. Respeta el orden de llegada de los grupos. */
export function groupProducts<P extends Original>(products:P[]):ProductGroup<P>[]{
 const groups=new Map<string,ProductGroup<P>>();
 for(const product of products){
  const model=clean(product.model);
  const category=clean(product.category);
  const key=model?`model:${fold(model)}:${product.categoryId??fold(category)}`:product.categoryId!=null?`category:${product.categoryId}`:category?`category:${fold(category)}`:`product:${product.id}`;
  const group=groups.get(key)||{key,title:model||category||clean(product.name),category:category||'Otros productos',categoryId:product.categoryId??null,section:product.section??null,sectionOrder:product.sectionOrder??null,byModel:Boolean(model),products:[],dimensions:[]};
  group.products.push(product);groups.set(key,group);
 }
 for(const group of groups.values()){
  const dimensions=(['gender','color','size'] as Dimension[]).filter(dimension=>new Set(group.products.map(product=>fold(valueOf(product,dimension)))).size>1);
  // Si dos productos coinciden en género, color y talla, se elige también el modelo.
  const combos=group.products.map(product=>dimensions.map(dimension=>fold(valueOf(product,dimension))).join('|'));
  if(new Set(combos).size<combos.length)dimensions.push('name');
  group.dimensions=dimensions;
 }
 return [...groups.values()];
}

const matches=(product:Original,choice:Choice)=>
 (Object.entries(choice) as [Dimension,string][]).every(([dimension,value])=>!value||fold(valueOf(product,dimension))===fold(value));
const inStock=(product:Original)=>product.currentStock>0;
/** Elección limitada a las dimensiones anteriores (género → color → talla → modelo). */
const prefix=(group:ProductGroup,choice:Choice,dimension:Dimension):Choice=>
 Object.fromEntries(group.dimensions.slice(0,group.dimensions.indexOf(dimension)).map(item=>[item,choice[item]]));

/**
 * Opciones de una dimensión, en cascada: solo las que existen con lo elegido antes
 * (p. ej. los colores que hay en «Dama»). «available» indica si hay existencia.
 */
export function optionsFor(group:ProductGroup,dimension:Dimension,choice:Choice):Option[]{
 const before=prefix(group,choice,dimension);
 const values=new Map<string,{value:string;stock:number}>();
 for(const product of group.products){
  if(!matches(product,before))continue;
  const value=valueOf(product,dimension);if(!value)continue;
  const entry=values.get(fold(value))||{value,stock:0};
  entry.stock+=Math.max(0,product.currentStock);values.set(fold(value),entry);
 }
 const byValue=new Map([...values.values()].map(entry=>[entry.value,entry]));
 return order(dimension,[...byValue.keys()]).map(value=>({value,label:value,available:(byValue.get(value)?.stock||0)>0,stock:byValue.get(value)?.stock||0}));
}

/** Producto que corresponde a la elección (o undefined si falta elegir algo). */
export function resolveVariant<P extends Original>(group:ProductGroup<P>,choice:Choice):P|undefined{
 const found=group.products.filter(product=>matches(product,choice));
 return found.length===1?found[0]:group.dimensions.every(dimension=>choice[dimension])?found.find(inStock)||found[0]:undefined;
}

/**
 * Ajusta la elección tras cambiar una dimensión (como Amazon): conserva lo elegido hasta
 * esa dimensión y completa las siguientes con lo que exista, prefiriendo lo que tenga existencia.
 */
export function reconcile(group:ProductGroup,choice:Choice,changed?:Dimension):Choice{
 const keepUntil=changed?group.dimensions.indexOf(changed):-1;
 const result:Choice={};
 group.dimensions.forEach((dimension,index)=>{
  const options=optionsFor(group,dimension,result);
  const wanted=options.find(option=>fold(option.value)===fold(choice[dimension]));
  const pick=index<=keepUntil&&wanted?wanted:wanted?.available?wanted:options.find(option=>option.available)||wanted||options[0];
  if(pick)result[dimension]=pick.value;
 });
 return result;
}

export const DIMENSION_LABELS:Record<Dimension,string>={gender:'Género',color:'Color',size:'Talla',name:'Modelo'};
/** Texto de búsqueda de todo el grupo. */
export const groupSearchText=(group:ProductGroup)=>[group.title,group.category,...group.products.flatMap(product=>[product.name,product.gender,genderLabel(product.gender),product.color,product.size,product.pricingGroup])].filter(Boolean).join(' ');

/** Todos los colores del grupo (para mostrarlos de un vistazo en la ficha). */
export function groupColors(group:ProductGroup){
 const colors=new Map<string,{value:string;available:boolean}>();
 for(const product of group.products){
  const value=productColor(product);if(!value)continue;
  const entry=colors.get(fold(value))||{value,available:false};
  entry.available||=product.currentStock>0;colors.set(fold(value),entry);
 }
 return [...colors.values()].sort((a,b)=>a.value.localeCompare(b.value,'es'));
}
