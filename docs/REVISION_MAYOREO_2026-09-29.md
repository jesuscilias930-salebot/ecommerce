# Revisión de mayoreo — 29 de septiembre de 2026

Estado: implementación local para aprobación. No se hizo push, despliegue, migración ni escritura en datos de producción. No se cambiaron tarifas ni condiciones comerciales.

## Cambios implementados

| Área | Resultado | Archivos principales |
| --- | --- | --- |
| Información comercial | Origen Orizaba, Veracruz; facturación con nombre del pedido y constancia al 272 129 5406. Ayuda y políticas usan el mismo bloque. El aviso de domicilio incompleto permanece. | `lib/legal.ts`, `components/business-contact.tsx`, `components/legal-page.tsx`, `app/ayuda/page.tsx` |
| Producto | Diferencia talla de embalaje. Surtido sin proporciones garantizadas; elección manual conserva cantidades por caja. Campos preparados para talla, material, altura y fotos identificadas por producto. | `lib/product-details.ts`, `lib/product-catalog.ts`, `components/bundle-content.tsx` |
| Fotografía | Conserva galerías asociadas por ID desde el backend. Carga diferida, decodificación asíncrona y dimensiones intrínsecas. No se trasladaron fotos de paquetes a individuales ni se generaron fotos de mercancía. | `components/store-photo.tsx` |
| Precios | Precio de la cantidad por agregar, subtotal, unidad, IVA y envío aparte. Mínimo acompañado del volumen; siguiente descuento calculado. Paquetes esperan cotización válida antes de habilitar el botón. | `lib/price-preview.ts`, `components/originals.tsx`, `components/shop.tsx`, `components/bundle-configurator.tsx` |
| Catálogo móvil | Tarjetas compactas, entrada libre, tablas desplegables, explicación de categoría contraída, referencias compartidas y buscador de productos. Carrito en una fila propia sin tapar mercancía. | `app/wholesale-clarity.css`, `components/originals.tsx`, `components/shop.tsx` |
| Configuración | Surtido automático / Elegir cantidades, contador, composición por caja y mitad/mitad solamente con dos variantes y stock suficiente conocido. El servidor conserva la comprobación final. | `components/bundle-configurator.tsx`, `lib/price-preview.ts` |
| Envío | Preparación de 2 días hábiles separada del tránsito. Editar dirección cancela consultas en curso. Firma de tarifa vinculada además a peso, dimensiones y valor declarado actuales. | `components/cart-shipping.tsx`, `components/purchase-timing.tsx`; backend `ShippingQuoteToken.java`, `StoreShippingGateway.java` |
| Portada/comparación | Mensaje para emprender y resurtir; oferta obtenida del catálogo con cantidad, total y promedio por par/unidad. Tarjetas comparables sin afirmar que un paquete mayor siempre es más barato. | `app/page.tsx`, `components/shop.tsx` |
| Medición | Eventos de producto, configuración, agregado, checkout, envío y pedido pendiente/WhatsApp. Lista permitida de parámetros sin formularios personales. Consentimiento, feature y dominio permitidos; espera inicialización del píxel; deduplicación de vistas y eventos únicos. Purchase sigue exclusivamente en el servidor tras pago confirmado. | `lib/store-events.ts`, `components/product-view-event.tsx`, `components/meta-pixel.tsx`, `components/checkout.tsx` |

## Pendientes reales, no ocultados

- **Tallas:** el propietario las agregará después. No se inventaron rangos. Se conserva la talla existente cuando está cargada y se muestra advertencia cuando falta.
- **Material y altura:** enviar datos por producto/variante; no se infieren por nombre ni fotografía.
- **Surtido automático:** no se promete una mezcla específica por género o edad. Solo las opciones reales con disponibilidad pueden seleccionarse manualmente.
- **Datos comerciales:** horario confirmado: de 8:00 a. m. a 6:00 p. m., incorporado a la información comercial compartida. Faltan días de atención, zona horaria y domicilio completo autorizado. Orizaba, Veracruz es origen de despacho, no sustituye el domicilio completo.
- **Fotografías:** para cada producto sin fotos verificadas se necesitan: surtido representativo, par completo, acercamiento de tejido, costuras, escala con regla y empaque. Identificar ID/nombre, género, talla y toma. No publicar datos personales visibles en etiquetas. La galería existente del CRM sigue siendo la vía de carga. El mapa `verifiedProductDetails` permite incorporar información editorial verificada por ID; no es un nuevo editor de fichas en el CRM.
- **Optimización adicional:** no se agregó un servicio de transformación de imágenes ni se reescribieron objetos S3. Se conserva compatibilidad con URLs firmadas; compresión/variantes responsivas en carga puede abordarse después.
- **Estimación postal:** el contrato actual `ShippingAddress.validate()` exige destino completo y contacto para `StorePackingService`/`StoreShippingGateway`. No se enviaron datos ficticios a Envia ni se inventó una tarifa. Una estimación solo con CP requiere separar ese contrato y validar con el proveedor los campos mínimos; no quedó implementada.
- **Analítica:** eventos del navegador son de mejor esfuerzo (bloqueadores, red, cierre de pestaña). WhatsApp espera como máximo 800 ms antes de navegar. Verificar recepción en Meta en un entorno de prueba autorizado antes de publicar; no se enviaron eventos reales durante esta revisión.
- **Validación comercial final:** revisar contenidos, fotografías y disponibilidad reales antes del lanzamiento. Esta revisión no certifica cumplimiento legal ni mejoras porcentuales de conversión.

## Pruebas

- `npm run build`: correcto, TypeScript y generación de rutas.
- `node --experimental-strip-types --test tests/*.test.mjs`: 62 pruebas correctas. Incluye selección, grupos combinables/no combinables, presentación en tripares, tarifas, consentimiento y deduplicación.
- Backend: `./gradlew test --tests 'com.socks.sock_control.services.*' --tests 'com.socks.sock_control.configuration.*' --tests 'com.socks.sock_control.controllers.*' --console=plain`: 238 pruebas, cero fallos/errores. Seis casos de firma de envío, incluyendo peso/medidas, destino, composición, vencimiento e importe alterado. No es una prueba de integración con una base de producción.
- Navegador local 390×844: cantidad vacía y superior a stock bloquean agregado; escritura `30` sin cero inicial; categoría y tabla desplegable; sin desbordamiento horizontal. Borde inferior del contenido a 784 px y carrito comienza a 784 px: no superposición.
- Flujo con datos ficticios: 60 pares individuales + caja personalizada 20/30 + caja automática = 160 pares; tarifa local de $8, cajas de $400, individuales $480 y subtotal $1,280. Los importes pertenecen exclusivamente al fixture, no son precios comerciales.
- Escritorio 1365×1400: precio de caja $400 consistente con carrito local, selección guardada y controles visibles; sin desbordamiento horizontal.
- Dirección sin cuenta; error/reintento de consulta postal y error de destino sin cobertura simulado. Pago bloqueado sin envío. No se pulsó el envío de pedido ni pago real.
- Revisión adicional del CSS móvil en `next start` tras compilar: grilla y separación del carrito correctas.
- Teclado: controles nativos etiquetados, radio/fieldset y summary accesibles; pendiente auditoría completa con lector de pantalla y dispositivos físicos. No se afirma cobertura E2E total de todos los navegadores.

## Revisión local reproducible

Desde la carpeta ecommerce, iniciar el fixture en una terminal:

```sh
node scripts/cro-preview-server.mjs
```

En otra terminal:

```sh
SOCK_CONTROL_URL=http://127.0.0.1:4319 \
STOREFRONT_PRODUCTS_MOCK=false STOREFRONT_BUNDLES_MOCK=false \
STOREFRONT_TENANT_ID=preview \
STOREFRONT_DOMAIN_TENANTS='{"127.0.0.1:4320":"preview","localhost:4320":"preview"}' \
npm run dev -- --hostname 127.0.0.1 --port 4320
```

Abrir `http://127.0.0.1:4320/productos`. El fixture no usa credenciales, base de datos ni servicios externos y rechaza pedidos/pagos. Sus datos no deben cargarse a producción. Las verificaciones de stock definitivas se cubren con el backend y sus pruebas, no con el fixture simplificado.

Capturas en el workspace del propietario: `revision-mayoreo-2026-09-29/catalogo-movil.png` y `revision-mayoreo-2026-09-29/paquete-escritorio.png`. Ambas muestran datos ficticios identificados como prueba.

## Publicación, solo después de aprobación

No se requieren migraciones ni nuevas variables para estos cambios. Se deben publicar ecommerce y backend de forma coordinada. Al actualizar la firma de envío, las tarifas emitidas por la versión anterior no se aceptarán y el cliente deberá volver a cotizar; su vigencia normal es de 10 minutos. Revisar datos comerciales pendientes, hacer smoke test de staging y solicitar autorización explícita antes de push/despliegue.
