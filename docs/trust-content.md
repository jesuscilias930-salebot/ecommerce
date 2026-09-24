# Contenido público de confianza

## Fotografías desde el CRM

En E-commerce → Testimonios puedes seleccionar varias fotografías, revisar su vista
previa y confirmar que tienes autorización para publicarlas. Publicar las guarda
en S3 y las registra en `store_images`, separadas por tenant y kind `testimonials`.
El inicio muestra hasta tres; `/referencias` muestra todas. Recarga la tienda para
ver cambios. Retirar elimina la referencia pública de la base de datos, no el archivo
privado de S3; los enlaces firmados anteriores pueden durar hasta 30 minutos.

Desplegar primero sockStockControl, después salesBotFront y ecommerce. Reutiliza
las credenciales S3 existentes y la tabla de galerías (sin su antiguo índice único).
No requiere variables nuevas ni migraciones adicionales sobre ese esquema.
Los textos de testimonios y políticas siguen configurándose como se indica abajo.

Configurar `lib/store-trust.ts` con información real del propietario:
- `storePolicies.preparation`: preparación, días aplicables y condiciones.
- `storePolicies.returns`: cambios, devoluciones e incidencias.
- `storePolicies.hours`: horario, días y zona horaria.
- `SUPPORT_URL`: contacto individual, solo tras autorización explícita para publicarlo.
- `customerReferences`: texto, nombre público, ciudad/fecha opcional, foto y bundleId opcional.

Las referencias requieren `published` y `publicationApproved` verdaderos.
Guardar el consentimiento de forma privada. Ocultar teléfonos, domicilios, guías,
códigos QR y de barras de las fotos antes de publicarlas. No usar URLs firmadas
temporales: usar imágenes públicas estables y autorizadas. No inventar opiniones,
estrellas, sellos, números de clientes, garantías o plazos de entrega.

Sin referencias se ofrece solicitarlas; sin políticas se indica que deben consultarse.
Completar las condiciones reales antes de considerar definitiva la información de compra.
Editar este archivo requiere desplegar ecommerce. No se agregó un CMS, migración ni
nueva dependencia. El grupo es opcional y advierte sobre la visibilidad del teléfono.
