'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="contenido" className="section empty"><h1>No pudimos cargar esta página.</h1><button className="primary" onClick={reset}>Intentar nuevamente</button></main>}
