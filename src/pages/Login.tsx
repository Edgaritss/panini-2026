import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { AuthShell } from '../components/AuthShell';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { clearSplashShown } from '../components/LogoSplash';
import { translateAuthError } from '../lib/authErrors';

export function Login() {
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(translateAuthError(err));
      return;
    }
    clearSplashShown();
    navigate('/album', { replace: true });
  }

  return (
    <AuthShell
      title="Bienvenido"
      subtitle="Entra a tu álbum"
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-secondary hover:underline">
            Crea una
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
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-small text-on-surface-variant hover:text-secondary transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
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
          disabled={busy || !email || !password}
          className="w-full h-12 rounded-lg bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="¿Olvidaste tu contraseña?"
        description={
          <>
            Por ahora el reset por correo no está habilitado.{' '}
            Contáctame directamente y te genero una nueva.
          </>
        }
        icon={{ name: 'mail', tone: 'danger' }}
        actions={
          <button
            type="button"
            onClick={() => setForgotOpen(false)}
            className="px-4 py-2 rounded bg-secondary text-on-secondary font-body-strong hover:bg-secondary-container transition-colors"
          >
            Entendido
          </button>
        }
      />
    </AuthShell>
  );
}

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}

export function Field({ label, type, value, onChange, autoComplete, required, hint }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-small text-on-surface-variant mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full h-11 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
      />
      {hint && <span className="block text-small text-on-surface-variant mt-1">{hint}</span>}
    </label>
  );
}
