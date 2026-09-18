# Productos individuales y precios por volumen

La tienda publica `/productos` desde `GET /products/all`. La bolsa usa IDs negativos internamente para productos y positivos para paquetes; a sock-control se envían IDs positivos.

El servidor Next mantiene `SOCK_CONTROL_URL` y `SOCK_CONTROL_TOKEN` privados. `POST /api/product-quote` valida cantidades y consulta `POST /price-rule/quote`. No crea ventas ni reserva stock. El flujo comercial sigue terminando en consulta por WhatsApp; no se añadió pago online.

## Agrupar variantes

Desplegar primero sock-control. La entidad Product incorpora `pricingGroup` (columna `pricing_group`). Si el entorno no usa actualización automática de Hibernate, aplicar una migración controlada: `ALTER TABLE products ADD COLUMN pricing_group VARCHAR(255) NULL;` únicamente si la columna no existe. No se ejecutó ninguna migración contra producción.

Con autenticación administrativa, configurar CADA producto que comparta volumen:

`PATCH /price-rule/product/{productId}/group`

```json
{"pricingGroup":"caricatura"}
```

Asignar la misma clave a dama y caballero. No se infieren grupos por nombre, género o categoría. `null` o cadena vacía desvincula el producto. Cada variante debe tener su propia regla aplicable para la cantidad conjunta; si se desea el mismo precio, configurar las mismas tarifas en ambas. Los productos sin grupo acumulan únicamente sus propias piezas. Los paquetes conservan precio fijo y no suman unidades al grupo.

Ejemplo: 50 dama + 50 caballero usa el rango de 100 para ambos. Quitar una pieza recalcula a 99. Se valida stock por variante, reglas sin huecos para la cantidad seleccionada y sin solapamientos. SaleService vuelve a aplicar la misma cotización antes de descontar stock FIFO; nunca confía en precios del navegador.

## Validación

`./gradlew test --tests '*VolumePricingServiceTest'` cubre acumulación 50+50, límites, duplicados, grupos separados, stock insuficiente y reglas ambiguas/ausentes.

`npm run build` comprueba frontend. Para probar end-to-end configurar credenciales de desarrollo y grupos reales. La cotización no incluye envío ni impuestos; confirmar total final antes del pago. El stock compartido entre paquetes y productos se valida al registrar la venta, no se reserva en la bolsa.
