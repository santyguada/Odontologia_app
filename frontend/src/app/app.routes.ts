import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { InicioComponent } from './paciente/inicio/inicio.component';
import { ReservaComponent } from './paciente/reserva/reserva.component';
import { ConfirmacionComponent } from './paciente/confirmacion/confirmacion.component';
import { MiTurnoComponent } from './paciente/mi-turno/mi-turno.component';
import { LoginComponent } from './panel/login/login.component';
import { AgendaComponent } from './panel/agenda/agenda.component';
import { NuevoTurnoComponent } from './panel/nuevo-turno/nuevo-turno.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'reservar', component: ReservaComponent },
  { path: 'confirmacion', component: ConfirmacionComponent },
  { path: 'mi-turno', component: MiTurnoComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AgendaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin', 'odontologo'] },
  },
  {
    path: 'admin/nuevo',
    component: NuevoTurnoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin'] },
  },
  { path: '**', redirectTo: '' },
];
