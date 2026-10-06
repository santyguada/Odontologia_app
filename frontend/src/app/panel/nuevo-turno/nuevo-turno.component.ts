import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { mensajeError } from '../../core/api';
import { formatearFecha } from '../../core/fechas';
import { PATRON_DNI, PATRON_EMAIL, PATRON_NOMBRE, PATRON_TELEFONO } from '../../core/validaciones';
import { SelectorHorarioComponent, SeleccionHorario } from '../../shared/selector-horario/selector-horario.component';

// Carga manual de un turno por el administrativo (paciente que llama por teléfono)
@Component({
  selector: 'app-nuevo-turno',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SelectorHorarioComponent],
  templateUrl: './nuevo-turno.component.html',
  styleUrl: './nuevo-turno.component.css',
})
export class NuevoTurnoComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
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

  invalido(campo: keyof NuevoTurnoComponent['form']['controls']): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  guardar(): void {
    const seleccion = this.seleccion();
    if (this.form.invalid || !seleccion) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set('');

    this.adminService
      .crear({ ...datos, obraSocial: datos.obraSocial.trim() || undefined, ...seleccion })
      .subscribe({
        // Vuelve a la agenda en el día del turno creado
        next: (turno) => this.router.navigate(['/admin'], { queryParams: { fecha: turno.fecha } }),
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.enviando.set(false);
        },
      });
  }
}
