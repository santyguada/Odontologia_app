import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/api';
import { formatearFecha, hoy } from '../../core/fechas';
import { EstadoTurno, Turno } from '../../core/models';
import { SelectorHorarioComponent, SeleccionHorario } from '../../shared/selector-horario/selector-horario.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [RouterLink, SelectorHorarioComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
})
export class AgendaComponent implements OnInit {
  private adminService = inject(AdminService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  formatearFecha = formatearFecha;
  // Si se viene de "Nuevo turno", la fecha llega por query param
  fecha = signal(this.route.snapshot.queryParamMap.get('fecha') ?? hoy());
  turnos = signal<Turno[]>([]);
  cargando = signal(false);
  error = signal('');
  mensaje = signal('');

  aReprogramar = signal<Turno | null>(null);
  nuevaSeleccion = signal<SeleccionHorario | null>(null);

  esAdmin = computed(() => this.auth.usuario()?.rol === 'admin');

  ngOnInit(): void {
    this.cargar();
  }

  cambiarFecha(valor: string): void {
    if (!valor) return;
    this.fecha.set(valor);
    this.mensaje.set('');
    this.aReprogramar.set(null);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.adminService.listar(this.fecha()).subscribe({
      next: (turnos) => {
        this.turnos.set(turnos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  cambiarEstado(turno: Turno, estado: EstadoTurno): void {
    if (estado === 'cancelado' && !confirm(`¿Cancelar el turno de ${turno.paciente.nombre} ${turno.paciente.apellido}?`)) {
      return;
    }
    this.error.set('');
    this.mensaje.set('');
    this.adminService.cambiarEstado(turno.id, estado).subscribe({
      next: (actualizado) => {
        this.mensaje.set(`Turno ${actualizado.codigo} ahora está ${actualizado.estado}.`);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }

  iniciarReprogramacion(turno: Turno): void {
    this.aReprogramar.set(turno);
    this.nuevaSeleccion.set(null);
    this.mensaje.set('');
    this.error.set('');
  }

  confirmarReprogramacion(): void {
    const turno = this.aReprogramar();
    const seleccion = this.nuevaSeleccion();
    if (!turno || !seleccion) return;

    this.adminService.reprogramar(turno.id, seleccion.fecha, seleccion.hora).subscribe({
      next: (actualizado) => {
        this.mensaje.set(
          `Turno ${actualizado.codigo} reprogramado para el ${formatearFecha(actualizado.fecha)} a las ${actualizado.hora} hs.`,
        );
        this.aReprogramar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
