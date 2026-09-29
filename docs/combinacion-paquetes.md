# Combinaciones de paquetes

Se habilita automáticamente para paquetes compuestos íntegramente por artículos marcados como **surtidos**, de una misma categoría Caricatura. No cambia las cajas fijas, deportivas ni mixtas. No duplica productos ni tarjetas del catálogo.

En el detalle: Surtido según existencias, opciones de género con stock y Elegir mi combinación. Las tallas y géneros proceden del inventario. La suma debe completar los pares por caja. Diseños y colores siguen sujetos a existencias. Precio y stock se verifican en SockControl antes de guardar y nuevamente antes del pago.

El carrito conserva una combinación por paquete: al editarlo se reemplazan explícitamente su cantidad y mezcla. Varias cajas del mismo paquete tienen la misma combinación. El desglose queda guardado en Pedidos para prepararlo, sin cambiar el bundle original. No se descuenta inventario al agregarlo al carrito o crear un pedido pendiente.

## Despliegue

1. Respaldar la base de SockControl y ejecutar `docs/migrations/bundle-customer-selection.sql` de ese repositorio. Agrega `selection` nullable a `store_order_lines` y `pending_order_items`.
2. Desplegar SockControl primero y luego ecommerce. No requiere variables nuevas ni despliegue de MerlynSeller.
3. Probar una caja surtida de 50: 20 niña + 20 niño + 10 adulto (con existencias). Confirmar desglose, precio por volumen y cotización de envío. Cambiar la mezcla debe invalidar el envío anterior.
4. Probar Stripe solo en sandbox. Verificar el desglose en Pedidos; un pago de prueba no debe descontar inventario real. Para el flujo real, mantener el descuento idempotente existente exclusivamente al confirmar pago.

La migración es aditiva; debe conservarse incluso al revertir la interfaz. No retirar el soporte del backend mientras haya pedidos personalizados pendientes.
