# Meta Pixel: primera etapa

ID público: `2294997607982799`. No requiere un token secreto.

- Solo PageView, después de aceptar publicidad.
- Habilitado únicamente en tienda.merlyncilias.com y ecommerce-9w7o.onrender.com.
- No se carga en localhost ni otros dominios de preview.
- Preferencias de cookies permite retirar el consentimiento.
- No hay imagen noscript: enviaría visitas sin consentimiento.
- No se registran páginas /pago/ ni visitas con parámetros de sesión, token o contacto.
- No se habilita configuración automática ni coincidencia avanzada.
- Purchase se envía desde SockControl mediante Conversions API después del pago confirmado por Stripe; no se dispara desde el navegador. Ver `sockStockControl/docs/meta-conversions.md` para migración, variables y pruebas.
- El consentimiento v2 incluye compras. Checkout remite cookies fbp/fbc solo con aceptación; el servidor añade user agent. No se envían datos de contacto.
- Pendientes: AddToCart, ViewContent, InitiateCheckout y Lead.

Desplegar ecommerce y probar en Administrador de eventos → Probar eventos.
Rechazar: no debe cargarse fbevents.js ni enviarse PageView.
Aceptar: una visita por cambio de ruta; navegar atrás también debe registrar visita.
Recargar conserva la preferencia. Retirarla detiene futuros eventos.
Verificar con bloqueadores desactivados solo para esta prueba.
No se ejecutaron eventos reales durante la compilación.

Revisar y completar el aviso de privacidad propio de la tienda antes del lanzamiento.
