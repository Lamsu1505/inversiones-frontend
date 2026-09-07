import { ErrorHandler, Injectable, isDevMode } from '@angular/core';

/**
 * Red de seguridad para cualquier error que se escape del manejo local de
 * cada componente. No reemplaza ese manejo: si un error llega acá, significa
 * que en algún punto faltó tratarlo como estado de la vista.
 *
 * Registrarlo evita que la app quede en un estado roto en silencio, y deja
 * el rastro para diagnosticar.
 *
 * A futuro, este es el punto natural para enviar errores a un servicio de
 * monitoreo (Sentry o similar) cuando la app esté en producción.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (isDevMode()) {
      console.error('[GlobalErrorHandler] Error no capturado:', error);
      return;
    }

    // En producción, evitar volcar el stack completo a la consola del
    // usuario. Acá iría el envío al servicio de monitoreo.
    console.error('[GlobalErrorHandler]', error);
  }
}