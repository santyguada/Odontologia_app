import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TurnosService } from '../../core/turnos.service';
import { mensajeError } from '../../core/api';
import { esDiaHabil, hoy } from '../../core/fechas';

export interface SeleccionHorario {
  fecha: string;
  hora: string;
}

// Fecha + grilla de horarios libres. Se reutiliza en reserva, mi-turno (reprogramar), agenda y nuevo turno.
@Component({
  selector: 'app-selector-horario',
  standalone: true,
  templateUrl: './selector-horario.component.html',
  styleUrl: './selector-horario.component.css',
})
export class SelectorHorarioComponent {
  private turnosService = inject(TurnosService);

  // Emite la fecha y hora elegidas, o null si se cambió la fecha y todavía no hay hora
  seleccion = output<SeleccionHorario | null>();

  minimo = hoy();
  fecha = signal('');
  horarios = signal<string[]>([]);
  horaElegida = signal<string | null>(null);
  cargando = signal(false);
  error = signal('');

  cambiarFecha(valor: string): void {
    this.fecha.set(valor);
    this.horaElegida.set(null);
    this.horarios.set([]);
    this.error.set('');
    this.seleccion.emit(null);

    if (!valor) return;
    if (!esDiaHabil(valor)) {
      this.error.set('El consultorio atiende de lunes a viernes');
      return;
    }

    this.cargando.set(true);
    this.turnosService.disponibles(valor).subscribe({
      next: (horarios) => {
        this.horarios.set(horarios);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  elegir(hora: string): void {
    this.horaElegida.set(hora);
    this.seleccion.emit({ fecha: this.fecha(), hora });
  }
}
