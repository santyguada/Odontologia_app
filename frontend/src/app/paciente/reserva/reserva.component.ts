import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TurnosService } from '../../core/turnos.service';
import { mensajeError } from '../../core/api';
import { formatearFecha } from '../../core/fechas';
import { PATRON_DNI, PATRON_EMAIL, PATRON_NOMBRE, PATRON_TELEFONO } from '../../core/validaciones';
import { SelectorHorarioComponent, SeleccionHorario } from '../../shared/selector-horario/selector-horario.component';

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [ReactiveFormsModule, SelectorHorarioComponent],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.css',
})
export class ReservaComponent {
  private fb = inject(FormBuilder);
  private turnosService = inject(TurnosService);
  private router = inject(Router);

  formatearFecha = formatearFecha;
  seleccion = signal<SeleccionHorario | null>(null);
  enviando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60), Validators.pattern(PATRON_NOMBRE)]],
    apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60), Validators.pattern(PATRON_NOMBRE)]],
    dni: ['', [Validators.required, Validators.pattern(PATRON_DNI)]],
    email: ['', [Validators.required, Validators.pattern(PATRON_EMAIL)]],
    telefono: ['', [Validators.required, Validators.pattern(PATRON_TELEFONO)]],
    obraSocial: ['', [Validators.maxLength(50)]],
  });

  // true si el campo fue tocado y tiene error (para mostrar el mensaje debajo)
  invalido(campo: keyof ReservaComponent['form']['controls']): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  confirmar(): void {
    const seleccion = this.seleccion();
    if (this.form.invalid || !seleccion) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set('');

    this.turnosService
      .crear({ ...datos, obraSocial: datos.obraSocial.trim() || undefined, ...seleccion })
      .subscribe({
        next: () => this.router.navigate(['/confirmacion']),
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.enviando.set(false);
        },
      });
  }
}
