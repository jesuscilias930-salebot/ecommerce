# Contenido público de confianza

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
