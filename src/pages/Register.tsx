import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { AuthShell } from '../components/AuthShell';
import { Field } from './Login';
import { Icon } from '../components/Icon';
import { translateAuthError } from '../lib/authErrors';

export function Register() {
  const signUp = useAuth((s) => s.signUp);
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function localValidation(): string | null {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return 'El correo no tiene un formato válido.';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe incluir al menos un número.';
    }
    if (password !== confirm) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const local = localValidation();
    if (local) {
      setError(local);
      return;
    }
    setBusy(true);
    const trimmed = email.trim();
    const err = await signUp(trimmed, password);
    if (err) {
      setBusy(false);
      setError(translateAuthError(err));
      return;
    }
    // Si "Confirm email" está OFF en Supabase, signInWithPassword funciona enseguida.
    const signInErr = await signIn(trimmed, password);
    setBusy(false);
    if (signInErr) {
      setError(
        'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.',
      );
      return;
    }
    navigate('/album', { replace: true });
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza tu álbum"
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-secondary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          hint="Mínimo 8 caracteres con al menos un número."
          required
        />
        <Field
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          required
        />
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-error-container bg-secondary-fixed p-3 text-small text-on-error-container flex items-start gap-2"
          >
            <Icon name="error" filled size={18} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !email || !password || !confirm}
          className="w-full h-12 rounded-lg bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
