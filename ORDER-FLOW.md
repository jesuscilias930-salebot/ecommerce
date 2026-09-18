# Tienda → orden → MerlynSeller (primera versión)

## Flujo implementado

1. En el carrito real, el cliente escribe nombre y teléfono con código de país y guarda el pedido.
2. Next valida el catálogo permitido y envía IDs/cantidades a `POST /store/orders` con el JWT de sock-control privado del servidor.
3. sock-control recalcula precios, valida stock combinado de productos y cajas, guarda nombres/precios/contenido y devuelve un folio. No crea venta, pago, reserva ni envío.
4. Un proceso de sock-control reintenta la entrega al CRM cada 60 segundos (hasta 20 órdenes por ciclo). Las órdenes pendientes permanecen guardadas cuando falla el CRM.
5. El CRM vincula teléfono exacto normalizado (código de país, solo dígitos), organización y conversación. No manda mensajes ni modifica automatizaciones existentes. Para nuevos leads, bot y escenarios nacen desactivados.
6. En herramientas del chat aparece «Pedidos de la tienda». Confirmar registra la venta con el servicio existente, conserva saleId y evita registrarla otra vez. La notificación posterior actualiza el CRM. Cambios de precios/contenido exigen crear otra orden; no se cambian silenciosamente.
7. Envíos se completan con las herramientas existentes del chat. Esta versión NO vincula automáticamente shipmentId a la orden ni procesa pagos.

## Configuración de desarrollo

### Cierre por WhatsApp y panel de ventas

- El checkout ofrece «Pagar ahora» (deshabilitado, pasarela pendiente) y «Concluir la venta por WhatsApp».
- La segunda opción guarda el pedido antes de abrir `wa.me` con el folio en el mensaje. El cliente debe pulsar Enviar. Si WhatsApp no abre, queda un enlace de reintento con el mismo folio.
- Un número de ventas mal configurado bloquea el cierre antes de crear el pedido. `NEXT_PUBLIC_WHATSAPP_NUMBER` debe incluir país, solo dígitos, sin `+`.
- En Control de ventas → Ventas, web y móvil muestran «Pedidos de la tienda», con cliente, teléfono, folio, estado, líneas y subtotal. «Actualizar pedidos» recarga el listado; no es una notificación WebSocket.
- El listado usa `GET /store/orders?page=0&size=10`, autenticado con la sesión de Control y restringido al tenant del JWT. El servidor limita size a 100 y ordena del más reciente al más antiguo.
- No se cobra, crea una venta ni descuenta stock al abrir WhatsApp. La confirmación de venta sigue siendo una operación separada y no equivale a confirmar un pago.
- Desplegar primero sock-control y después las interfaces. Esta ampliación del listado no agrega tablas ni columnas.

Prueba local: realizar el cierre con un catálogo real de desarrollo, verificar el folio en WhatsApp y buscarlo en Ventas → Pedidos de la tienda → Actualizar pedidos. Revisar que no aumente el contador de ventas ni cambie inventario. No usar producción para esta prueba.

### ecommerce `.env.local`

SOCK_CONTROL_URL y SOCK_CONTROL_TOKEN deben apuntar al backend actualizado y al tenant de la tienda. Configurar NEXT_PUBLIC_WHATSAPP_NUMBER y STOREFRONT_BUNDLE_IDS. Desactivar STOREFRONT_PRODUCTS_MOCK / STOREFRONT_BUNDLES_MOCK para guardar órdenes reales. Los mocks nunca generan órdenes.

### sock-control

```env
STORE_CRM_URL=https://TU-CRM/store-orders/events
STORE_CRM_SECRET=SECRETO_COMPARTIDO_DE_AL_MENOS_32_CARACTERES
STORE_CRM_TENANT=TENANT_DE_LA_TIENDA
```

### salesBotBackend

```env
STORE_WEBHOOK_SECRET=MISMO_SECRETO_COMPARTIDO
STORE_STOCK_TENANT_ID=MISMO_TENANT
STORE_ORGANIZATION_ID=UUID_ORGANIZACION_CRM
```

El vínculo tenant→organización está configurado en servidor, no se acepta del navegador. Este envío programado soporta una tienda/tenant por despliegue configurado. Para múltiples tiendas hace falta un registro de integraciones por tenant.

## Esquema y despliegue

- No se aplicaron migraciones en bases de datos reales.
- sock-control necesita tablas `store_orders` y `store_order_lines` (entidades StoreOrder y Line). En desarrollo pueden generarse con Hibernate ddl-auto=update; en producción preparar/revisar la migración antes de desplegar, con copia de seguridad. No cambiar ddl-auto a update a ciegas.
- En salesBotBackend ejecutar su flujo habitual `npm run migrate` apuntando primero a desarrollo: incluye `031_store_orders.sql`.
- Desplegar CRM receptor + migración, sock-control, frontend CRM y tienda. Iniciar sesión también en Control dentro del CRM para confirmar ventas: se usa su token existente.
- El receptor requiere HTTPS en producción. Configurar límites de solicitudes en el proxy de la tienda para `/api/orders` antes de abrir al público; actualmente valida origen, tamaño y catálogo, pero no incluye protección distribuida antiabuso.

## Prueba manual antes de producción

1. Crear pedido con productos reales del tenant, repetir el envío con el mismo requestId: mismo folio, sin venta ni descuento.
2. Verificar aparición en CRM tras el ciclo de entrega. Reabrir chat para refrescar.
3. Detener receptor, crear orden, levantar receptor: debe aparecer una sola orden.
4. Confirmar una orden: se crea una venta. Repetir confirmación: conserva saleId.
5. Cambiar precios o superar stock antes de confirmar: rechazo sin venta.
6. Comprobar otro tenant: orden inaccesible.

Los subtotales no incluyen el envío. Confirmar una venta usa los impuestos del servicio de ventas existente, no confirma un pago. No confundir el subtotal con un total final cobrado.

## Verificación local

Tienda: npm run build. Backend: ./gradlew test --tests '*StoreOrderServiceTest' --tests '*VolumePricingServiceTest'. CRM frontend: tsc detecta un error ajeno en ScenariosPanel.tsx (filename nullable). Falta validación end-to-end con las bases de desarrollo y credenciales configuradas.
