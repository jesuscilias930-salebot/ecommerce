import type { NextConfig } from 'next';
const config:NextConfig={async headers(){return [{source:'/:path*',headers:[
 {key:'Referrer-Policy',value:'no-referrer'},
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' https://connect.facebook.net 'unsafe-inline'"+(process.env.NODE_ENV==='development'?" 'unsafe-eval'":"")+"; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self' https://www.facebook.com https://connect.facebook.net; frame-src https://*.stripe.com; form-action 'self' https://checkout.stripe.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'"}
 ]}];}};
export default config;
