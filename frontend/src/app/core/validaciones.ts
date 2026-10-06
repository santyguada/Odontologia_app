// Mismas reglas que backend/src/utils/validators.ts (sección 4 de la especificación)
export const PATRON_DNI = /^\d{7,8}$/;
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PATRON_TELEFONO = /^\d{8,15}$/;
export const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
export const PATRON_CODIGO = /^[Tt]-[A-Za-z0-9]{5}$/;
