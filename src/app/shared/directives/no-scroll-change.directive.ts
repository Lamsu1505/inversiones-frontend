import { Directive, HostListener } from '@angular/core';

/**
 * Bloquea el comportamiento nativo de Chrome/Firefox donde, si un
 * <input type="number"> tiene el foco, la rueda del mouse incrementa o
 * decrementa su valor en vez de scrollear la página. Es un comportamiento
 * del navegador, no un bug de la app, pero en un formulario es más trampa
 * que ayuda — el usuario scrollea la pantalla y sin querer cambia la tasa
 * o los años.
 *
 * No hace falta condicionar el preventDefault al foco del input: el evento
 * 'wheel' solo llega al elemento si el cursor está físicamente sobre él, así
 * que nunca interfiere con el scroll normal de la página en otro punto.
 *
 * Uso: <input type="number" formControlName="tasaEA" appNoScrollChange />
 */
@Directive({
  selector: '[appNoScrollChange]',
  standalone: true,
})
export class NoScrollChangeDirective {
  @HostListener('wheel', ['$event'])
  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
  }
}