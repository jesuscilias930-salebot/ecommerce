'use client';
import type {InputHTMLAttributes} from 'react';

// Text + numeric keyboard lets React normalize "030" immediately and keeps zero
// empty while editing. Quantity limits remain enforced by each purchase form.
export function QuantityInput({value,onChange,...props}:InputHTMLAttributes<HTMLInputElement>){
 return <input {...props} type="text" inputMode="numeric" pattern="[0-9]*"
  value={value===0?'':value} onChange={event=>{
   if(/^\d*$/.test(event.target.value))onChange?.(event);
  }}/>;
}
