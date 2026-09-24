'use client';
export function CookiePreferences(){return <button type="button" onClick={()=>window.dispatchEvent(new Event('merlyn:cookie-preferences'))}>Cambiar preferencias de cookies</button>;}
