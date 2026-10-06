import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TurnosService } from '../../core/turnos.service';
import { mensajeError } from '../../core/api';
import { formatearFecha } from '../../core/fechas';
import { Turno } from '../../core/models';
import { PATRON_CODIGO, PATRON_DNI } from '../../core/validaciones';
import { SelectorHorarioComponent, SeleccionHorario } from '../../shared/selector-horario/selector-horario.component';

@Component({
  selector: 'app-mi-turno',
  standalone: true,
  imports: [ReactiveFormsModule, SelectorHorarioComponent],
  templateUrl: './mi-turno.component.html',
  styleUrl: './mi-turno.component.css',
})
export class MiTurnoComponent {
  private fb = inject(FormBuilder);
  private turnosService = inject(TurnosService);

  formatearFecha = formatearFecha;
  turno = signal<Turno | null>(null);
  reprogramando = signal(false);
  nuevaSeleccion = signal<SeleccionHorario | null>(null);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  // Solo se pueden modificar turnos pendientes o confirmados
  modificable = computed(() => {
    const estado = this.turno()?.estado;
    return estado === 'pendiente' || estado === 'confirmado';
  });

  form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(PATRON_DNI)]],
    codigo: ['', [Validators.required, Validators.pattern(PATRON_CODIGO)]],
  });

  private manejarError = (err: HttpErrorResponse) => {
    this.error.set(mensajeError(err));
    this.cargando.set(false);
  };

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { dni, codigo } = this.form.getRawValue();
    this.limpiarMensajes();
    this.turno.set(null);
    this.reprogramando.set(false);
    this.cargando.set(true);

    this.turnosService.buscar(codigo.toUpperCase(), dni).subscribe({
      next: (turno) => {
        this.turno.set(turno);
        this.cargando.set(false);
      },
      error: this.manejarError,
    });
  }

  cancelar(): void {
    const turno = this.turno();
    if (!turno || !confirm('¿Seguro que querés cancelar el turno?')) return;
    this.limpiarMensajes();
    this.cargando.set(true);

    this.turnosService.cancelar(turno.codigo, turno.paciente.dni).subscribe({
      next: (actualizado) => {
        this.turno.set(actualizado);
        this.mensaje.set('El turno fue cancelado.');
        this.cargando.set(false);
      },
      error: this.manejarError,
    });
  }

  confirmarReprogramacion(): void {
    const turno = this.turno();
    const seleccion = this.nuevaSeleccion();
    if (!turno || !seleccion) return;
    this.limpiarMensajes();
    this.cargando.set(true);

    this.turnosService.reprogramar(turno.codigo, turno.paciente.dni, seleccion.fecha, seleccion.hora).subscribe({
      next: (actualizado) => {
        this.turno.set(actualizado);
        this.reprogramando.set(false);
        this.nuevaSeleccion.set(null);
        this.mensaje.set('El turno fue reprogramado. Conservás el mismo código.');
        this.cargando.set(false);
      },
      error: this.manejarError,
    });
  }

  alternarReprogramar(): void {
    this.reprogramando.set(!this.reprogramando());
    this.nuevaSeleccion.set(null);
    this.limpiarMensajes();
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
