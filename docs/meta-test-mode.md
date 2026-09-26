# Probar la tienda sin enviar eventos a Meta

Abre cualquier página de la tienda con `?meta_test=1`, por ejemplo:

https://tienda.merlyncilias.com/?meta_test=1

Si la URL ya tiene parámetros, añade `&meta_test=1`.

- No se carga el píxel ni se emite PageView mientras el modo está activo, incluso si previamente aceptaste publicidad.
- La preferencia se mantiene con una cookie de sesión y sessionStorage al navegar, recargar y volver de Stripe. No necesitas añadir el parámetro a cada enlace.
- El checkout marca la atribución como desactivada. La API también bloquea la atribución cuando recibe la cookie de prueba, aunque el cuerpo solicite consentimiento. SockControl guarda el pedido sin consentimiento de Meta y su proceso de Purchase lo excluye.
- El aviso visible confirma que estás probando. Para salir, usa el enlace del aviso o visita `/?meta_test=0`. No modifica tu preferencia de cookies publicitarias.
- Esto **solo desactiva Meta**: no activa sandbox, no evita cobros reales, no evita guardar pedidos ni cambia existencias. Usa el ambiente de pruebas de Stripe para pagos de prueba.
- Actívalo **antes de empezar una compra nueva**. No cancela eventos ya enviados ni cambia pedidos o sesiones de pago creados antes de activarlo.
- La cookie pertenece al dominio usado. Activa el modo también si pruebas mediante otra URL de la tienda o en otro navegador. Los navegadores pueden restaurar cookies de sesión; sal explícitamente con `meta_test=0` cuando termines.

No requiere variables nuevas, cambios de backend ni migración.
