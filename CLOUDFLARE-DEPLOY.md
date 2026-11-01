# Publicación en Cloudflare Workers

El archivo Cloudflare-revelacionbaby.tar.gz contiene el código completo y los recursos de la versión actual: HUD PC/Móvil, registro, invitación PDF del 15 de noviembre y correos. No contiene credenciales ni registros privados.

## Workers Builds
- Project name: revelacionbaby-com
- Root directory: /
- Build command: tar -xzf Cloudflare-revelacionbaby.tar.gz && npm --prefix cloudflare install
- Deploy command: npm --prefix cloudflare run deploy
- Preview builds: desactivar durante la configuración inicial

El despliegue utiliza D1 (DB) y R2 (BUCKET). Si la cuenta solicita habilitar R2, completar ese paso en Cloudflare antes del despliegue.

## Configuración privada pendiente
PRIVATE_SEED debe configurarse como Secret en el Worker. Nunca subir su valor a GitHub. Hasta configurar el Secret, la aplicación no permitirá registros.

Después del despliegue hay que probar sesiones, guardado del HUD, CPU del plan gratuito, PDF, correo y persistencia. No comprar un dominio ni considerar terminada la migración antes de esas pruebas.
