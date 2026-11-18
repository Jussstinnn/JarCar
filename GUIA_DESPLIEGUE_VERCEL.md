# Jarcar Motors — R25: guía de despliegue en Vercel

**Objetivo:** compartir una **propuesta visual privada** con Jarcar Motors. Esta entrega contiene **solo frontend** (React + TypeScript + Vite). No hay backend, base de datos, autenticación de clientes ni inventario en tiempo real.

## 1. Verificación antes de subir

1. Descomprimí el ZIP en una carpeta nueva.
2. Abrí `JARCAR_FRONTEND_R25_VERCEL` (la carpeta que contiene `package.json` y `vercel.json`).
3. Ejecutá `VALIDAR_VERCEL.bat` en Windows. Hace verificaciones offline, instala dependencias si faltan y corre `npm run build`.
4. Abrí `INICIAR_JARCAR.bat` y probá en móvil y escritorio:
   - Home `/jarcar`
   - Inventario `/jarcar/inventario`
   - Ficha `/jarcar/inventario/ford-f150-raptor-2019`
   - Nosotros `/jarcar/jarcar-motors`
   - Visítanos `/jarcar/visitanos`
   - Guardados, comparador, búsqueda y «Tu ruta».
5. Confirmá que **el menú móvil queda fijo arriba incluso después de bajar varias pantallas** y que no tapa textos al navegar a anclas.

Si `npm run build` falla, **no compartás todavía el enlace**. Corregí los errores antes de presentarlo.

## 2. Opción A — GitHub + Vercel (recomendada)

1. Creá un repositorio privado nuevo en GitHub, por ejemplo `jarcar-propuesta-web`.
2. Subí **solo el contenido de esta carpeta** al directorio raíz del repositorio. No subás los ZIP anteriores, `node_modules`, `dist` ni otras versiones.
3. Iniciá sesión en [Vercel](https://vercel.com/new). Elegí **Add New > Project** y seleccioná el repositorio de GitHub.
4. Confirmá que los ajustes sean:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (la carpeta que tiene `package.json`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Node.js Version:** 22.x
5. Hacé clic en Deploy. `vercel.json` gestiona las rutas SPA, redirige `/` a `/jarcar` y conserva enlaces directos a las fichas.
6. Antes de enviar: abrí el enlace en una ventana privada y probá cargar/refrescar `/jarcar/inventario/ford-f150-raptor-2019`. No debería dar 404.

## 3. Opción B — Vercel CLI

Desde PowerShell dentro de `JARCAR_FRONTEND_R25_VERCEL`:

```powershell
npm install
npm run build
npx vercel@latest
```

En el asistente, autenticá tu cuenta y elegí crear un proyecto nuevo. El comando sin `--prod` genera un despliegue de vista previa por defecto. Si decidís usar el dominio de producción de un **proyecto de propuesta separado**, se puede ejecutar `npx vercel@latest --prod` tras revisar su visibilidad y permisos. No cambiés el dominio actual de Jarcar ni asocies el dominio oficial sin su autorización.

## 4. Privacidad y cómo compartirlo

- Esta propuesta tiene `<meta name="robots" content="noindex, nofollow">` y la cabecera `X-Robots-Tag: noindex, nofollow, noarchive`. **Esto evita indexación convencional, pero NO sustituye protección de acceso.**
- En Vercel, **Deployment Protection > Vercel Authentication** puede limitar acceso a usuarios autorizados; para mostrarla a un tercero, verificá que el destinatario tenga acceso o que puedas generar un enlace compartible. Las opciones de protección por contraseña dependen del plan.
- Si preferís una URL pública fácil de abrir, usá un **proyecto de propuesta independiente**, nunca el dominio oficial del concesionario, y solo tras confirmar qué materiales están autorizados para compartir.
- No atribuyas a Jarcar aprobación, garantía, financiación, servicio de inspección ni disponibilidad en tiempo real si no lo confirmó.
- Las imágenes de inventario provienen de anuncios recopilados para esta propuesta; confirmá autorización de uso y vigencia de precio, fotos, datos y stock **antes de un lanzamiento oficial**.
- Algunas composiciones editoriales son imágenes generadas; no deben interpretarse como fotografías reales de instalaciones, equipo o unidades en venta.
- Confirmá el número de WhatsApp antes de compartir un flujo comercial: un teléfono público no prueba que atienda WhatsApp.

## 5. Qué revisar cuando Vercel entregue la URL

- La Home carga desde la URL raíz, que redirige a `/jarcar`.
- Una ficha directa abre al pegar el enlace y al pulsar F5.
- Fotografías, tipografías, iconos y mapa se ven correctamente en HTTPS.
- El header queda fijo al bajar; menú y búsqueda funcionan en móvil.
- No hay desplazamientos horizontales a 320/375/390/430 px.
- El enlace de WhatsApp (si se utiliza) apunta al canal verificado por Jarcar.
- Todas las páginas tienen textos y precios adecuados a una propuesta comercial.

## 6. Estado de la entrega

**Preparada a nivel de código y configuración para desplegar**. La compilación completa y la prueba final en una URL real deben pasar antes de presentarla como certificada. No se ha creado ni modificado ningún proyecto de Vercel desde esta conversación.

Referencias de configuración:
- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404
- https://vercel.com/docs/deployment-protection
