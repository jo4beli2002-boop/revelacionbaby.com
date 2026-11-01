# Una dulce sorpresa · Revelación del bebé

Invitación con tres páginas, animaciones, registro de asistencia, correos personalizados, HUD y vista de Gabriela.

## Ejecutar

Requiere Node.js 22 o posterior.

```sh
npm install
npm start
```

Abrir http://127.0.0.1:4187/. Mantener el servidor abierto.

## Datos y acceso

Solo SRJO4B_ADMIN puede editar la página. Gabriela tiene su propia contraseña y puede consultar, agregar y editar familias, sin editar el diseño ni confirmar asistencia.

project-defaults.json conserva los ajustes del diseño preparados para esta publicación. Los cambios posteriores se guardan en .data/project-config.json.

La carpeta .data contiene credenciales privadas, registros de invitados, sesiones y la conexión a Gmail. No se publica en GitHub. Al instalar un servidor nuevo, se debe transferir esa carpeta de forma privada para conservar el acceso y los registros.

## Correos y WhatsApp

Google Apps Script envía los correos mediante solicitudes firmadas HMAC. El código está en google-apps-script/Code.gs. OWNER_EMAIL e INVITATION_SECRET se guardan en las propiedades privadas del script. La URL /exec y la clave se configuran en HUD > Notificaciones. La versión 3 permite adjuntar invitaciones JPG personalizadas. El estado Enviado significa que Google aceptó el envío, no que se haya leído ni que haya llegado a Recibidos.

WhatsApp es manual: los botones preparan el mensaje y la persona pulsa Enviar.

## Alojamiento

Para publicar todas las funciones se necesita un servidor Node.js con HTTPS y almacenamiento persistente para .data y los medios subidos desde el HUD. GitHub guarda el código. GitHub Pages no ejecuta este backend. Esta versión del servidor escucha en localhost.

## Archivos

- public/: interfaz y medios.
- server.mjs y auth.mjs: servidor y control de acceso.
- gmail-notifications.mjs: registros y cola de correo.
- invitation-attachment.mjs: invitación personalizada por familia.
- google-apps-script/: relay de Gmail sin secretos.

No se incluyen contraseñas, claves privadas ni registros de invitados en el repositorio.
