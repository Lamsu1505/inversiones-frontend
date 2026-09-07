import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error técnico al mensaje que ve el usuario, en es-CO.
 *
 * Punto único de traducción: si mañana el backend adopta Problem Details
 * (RFC 7807) y empieza a mandar un `detail` legible, se lee acá y nada más
 * de la app cambia.
 *
 * OJO con `HttpErrorResponse`: implementa la interfaz Error pero extiende
 * HttpResponseBase, así que `instanceof Error` da false aunque TypeScript
 * diga lo contrario. Por eso se verifica con `instanceof HttpErrorResponse`
 * primero y de forma explícita.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    // status 0 = la petición nunca llegó: servidor caído, sin red, o CORS.
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que esté encendido.';
    }

    switch (error.status) {
      case 400:
        return 'La solicitud tiene datos inválidos.';
      case 401:
        return 'Tu sesión expiró. Vuelve a iniciar sesión.';
      case 403:
        return 'No tienes permiso para ver esta información.';
      case 404:
        return 'No se encontró la información solicitada.';
      case 409:
        return 'El dato entra en conflicto con uno que ya existe.';
      case 500:
      case 502:
      case 503:
        return 'El servidor tuvo un problema. Intenta de nuevo en un momento.';
      default:
        return `Error del servidor (${error.status}).`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ocurrió un error inesperado.';
}