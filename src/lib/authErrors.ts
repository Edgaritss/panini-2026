import type { AuthError } from '@supabase/supabase-js';

const MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Confirma tu correo antes de iniciar sesión.'],
  [/user already registered/i, 'Ya existe una cuenta con ese correo.'],
  [/email rate limit exceeded/i, 'Demasiados intentos. Espera unos minutos.'],
  [/password should be at least/i, 'La contraseña es demasiado corta.'],
  [/network/i, 'Sin conexión. Inténtalo de nuevo en un momento.'],
  [/signups? (?:not allowed|disabled)/i, 'El registro está cerrado por ahora.'],
];

export function translateAuthError(error: AuthError | string | null): string {
  if (!error) return 'Error desconocido.';
  const msg = typeof error === 'string' ? error : error.message;
  for (const [re, friendly] of MAP) {
    if (re.test(msg)) return friendly;
  }
  return msg;
}
