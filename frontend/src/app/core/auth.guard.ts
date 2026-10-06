import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './models';

// Sin sesión -> /login. Si la ruta define data.roles y el rol no está incluido -> /admin.
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const usuario = auth.usuario();
  if (!auth.token() || !usuario) return router.createUrlTree(['/login']);

  const roles = route.data['roles'] as Rol[] | undefined;
  if (roles && !roles.includes(usuario.rol)) return router.createUrlTree(['/admin']);

  return true;
};
