# Merlyn Ecommerce

Iniciar local: npm run dev -- --port 3000

Tienda independiente en Next.js App Router, React, TypeScript y Tailwind CSS. Backend existente: `/Users/merlyncilias/Desktop/Negocio Calcetines/plataforma/sock-control` (Spring Boot 4, Java 21, MySQL).

## Ejecutar

Requiere Node >=20.9. `npm install`, luego `npm run dev`. Abrir http://localhost:3000. `npm run build` y `npm start` para producción. `npm run typecheck` para validar TypeScript.

## Conectar al backend

Crear `.env.local` tomando `.env.example` como referencia. Configurar SOCK_CONTROL_URL (ejemplo http://localhost:8080), SOCK_CONTROL_TOKEN (JWT vigente) y STOREFRONT_BUNDLE_IDS (IDs separados por coma de los paquetes aprobados para publicar). NEXT_PUBLIC_WHATSAPP_NUMBER es el número comercial, solo dígitos con código de país.

`lib/catalog.ts` consulta GET /bundles y GET /products/all desde el servidor usando Authorization Bearer. El JWT nunca se envía al navegador. Solo se serializa información comercial de los paquetes seleccionados; no costos de compra ni assignedUnitPrice. Disponibilidad calculada por el componente limitante, sumando cantidades repetidas del mismo producto. No se abren endpoints administrativos. El backend no fue modificado.

Sin URL se muestran datos de demostración claramente identificados y se bloquea el envío de la bolsa. Con URL y sin IDs aprobados el catálogo permanece vacío. Ante errores no se sustituyen los datos reales por precios de demostración. El token expirado requiere renovación; para producción conviene un endpoint público de catálogo con campos y publicación controlados por el backend.

## Incluido

Inicio adaptable, catálogo con búsqueda/filtros/orden, detalle por paquete, bolsa persistente en localStorage con edición de cantidades, consulta de pedido por WhatsApp, estados vacíos/error/agotado. Las imágenes son ilustraciones CSS explícitas: el backend actual no incluye fotos de producto. Sustituirlas por imágenes reales y una API de medios antes del lanzamiento.

## Pendiente antes de venta autónoma

Checkout, pasarela de pago, webhooks verificados/idempotentes, cálculo de precios e inventario en servidor al crear pedidos, reservas de stock, validación conjunta de existencias compartidas entre paquetes, integración de cotización Envia.com en checkout, políticas comerciales y fotos reales. La bolsa es una intención de compra, no crea ventas ni cobra ni reserva mercancía. No usar POST /sales al agregar productos o como confirmación de pago.

La consulta por WhatsApp comunica un subtotal orientativo; el asesor debe validar existencias compartidas, precio vigente y envío. Las condiciones y datos comerciales deben configurarse antes de publicar. No se incluyeron reseñas ni promesas de ganancias ficticias.
