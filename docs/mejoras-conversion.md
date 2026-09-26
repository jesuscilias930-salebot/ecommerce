# Descubrimiento y compra: patrones de Amazon adaptados a Merlyn

## Alcance

Revisión de los principales puntos del recorrido de compra y documentación pública
de Amazon; no es una auditoría exhaustiva de todas sus páginas, países o experiencias
personalizadas. Se conserva la marca Merlyn, la venta por volumen y el checkout
existente. No se copiaron imágenes, reseñas ni contenido de Amazon.

| Área | Decisión para Merlyn |
| --- | --- |
| Inicio | Conservar rutas de paquetes/productos, ayuda, comunidad y testimonios existentes. No etiquetar productos como «más vendidos» sin datos. |
| Encabezado y búsqueda | Implementado buscador accesible desde cualquier página; el cliente elige paquetes o productos. Admite palabras en cualquier orden y sin acentos. |
| Resultados | Buscar también en el contenido del paquete. Agregados orden por costo promedio por par y por pares incluidos. Los filtros de presupuesto siguen consultándose en el backend. |
| Comparación | Implementada selección de hasta tres paquetes del catálogo consultado, con inversión, pares, promedio, contenido y stock actuales. No se almacenan precios en el navegador. |
| Ficha | Reorganizada en galería/contenido y panel de compra; selector de cajas con total, navegación interna y panel fijo al desplazarse en escritorio. |
| Móvil | Panel de compra después de la galería y acceso inferior a la cantidad; tablas con desplazamiento horizontal. |
| Alternativas | Hasta tres paquetes disponibles: primero productos en común, después cercanía de precio. Se excluye el paquete actual; no son recomendaciones de IA ni «comprados juntos». Sin solicitudes adicionales al backend. |
| Precios B2B | Se conservan las escalas actuales por grupo. En cajas se distingue costo promedio por par de una tarifa individual; IVA y envío se aclaran junto al precio. |
| Confianza | Acceso a referencias reales y preguntas de envío, surtido, invitado y atención. Sin estrellas inventadas, urgencia artificial ni fechas de entrega no cotizadas. |
| Carrito | Se mantiene el ajuste de cantidades y el cálculo existente. Al agregar cajas desde la ficha, «Revisar mi pedido» no agrega nuevamente la selección. |
| Checkout | Sin cambios de pasarela, feature flags, consentimiento o creación de pedidos. El usuario revisa el carrito antes del pago. |
| Poscompra | Se conserva la confirmación y limpieza del carrito. Seguimiento público de pedido y recompra requieren un diseño posterior de acceso seguro. |

## Referencias públicas consultadas

- Búsqueda, comparación y herramientas de compra: https://www.aboutamazon.com/news/retail/best-amazon-shopping-tips
- Contenido de fichas de producto: https://sell.amazon.com/blog/amazon-product-listings
- Reseñas auténticas: https://www.aboutamazon.com/news/retail/amazon-customer-reviews-star-ratings
- Descuentos por cantidad: https://business.amazon.com/en/blog/instant-savings-quantity-discounts

Las referencias describen patrones; no prueban que esta implementación aumentará
las ventas de Merlyn. Esa es una hipótesis que debe medirse con tráfico real.

## Validación

- Pruebas automatizadas de búsqueda y ranking de alternativas.
- TypeScript y compilación de producción.
- Prueba en navegador local con mocks: comparación de tres paquetes y bloqueo del
  cuarto; búsqueda «dama caricatura» encuentra paquetes por su contenido; selección
  de dos cajas y después tres adicionales, mostrando cinco al revisar sin duplicar.
- Revisión visual a 390 px y 1440 px. La comparación desplaza su tabla, no la página.
- No se hizo un cobro, envío de WhatsApp ni un pedido real.

```sh
node --experimental-strip-types --test tests/*.test.mjs
npm run build
```

## Medición después del despliegue

Comparar períodos equivalentes y segmentar móvil/escritorio y origen de tráfico:
visitas → ficha → carrito → inicio de checkout → compra confirmada. El evento
Purchase ya existente no debe alterarse ni duplicarse. No se añadieron eventos
publicitarios nuevos con esta tarea.

Prioridades posteriores: medir búsquedas sin resultados, uso de comparación,
abandono de checkout y consultas frecuentes. Cualquier analítica adicional debe
respetar el consentimiento existente. Guardar favoritos, reseñas verificadas y
seguimiento de pedidos se dejan pendientes, no se simulan con datos ficticios.

## Despliegue

Solo cambia ecommerce. No requiere migraciones, variables nuevas ni cambios de
backend. Publicar mediante el flujo Git/Render cuando el usuario lo autorice.
