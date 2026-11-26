import React, { FormEvent, useState } from 'react';

interface PasswordLoginProps {
  passwordLoginEnabled: boolean;
  onAuthenticated: () => void;
}

export const PasswordLogin: React.FC<PasswordLoginProps> = ({ passwordLoginEnabled, onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/unlock-app', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ method: 'password', credential: password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        setError(typeof result.error === 'string' ? result.error : 'Aanmelden is niet gelukt. Controleer je wachtwoord.');
        return;
      }
      setPassword('');
      onAuthenticated();
    } catch {
      setError('Alchemy is momenteel niet bereikbaar. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--app-bg)] text-[var(--text-primary)] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-7 sm:p-9 shadow-xl">
        <div className="text-center mb-8">
          <div className="font-serif tracking-[0.35em] text-sm mb-5 opacity-80">P&M</div>
          <h1 className="font-serif text-3xl tracking-wide">Alchemy</h1>
          <p className="text-sm opacity-70 mt-3">Jouw persoonlijke ruimte. Veilig en alleen toegankelijk voor jou.</p>
        </div>

        {passwordLoginEnabled ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="alchemy-password" className="block text-sm font-medium mb-2">Persoonlijk wachtwoord</label>
              <input
                id="alchemy-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                maxLength={1024}
                autoFocus
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--app-bg)] px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Voer je wachtwoord in"
              />
            </div>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={busy || !password} className="w-full rounded-xl px-4 py-3 font-medium bg-[var(--text-primary)] text-[var(--app-bg)] disabled:opacity-50 transition">
              {busy ? 'Bezig met aanmelden…' : 'Alchemy openen'}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed">
            <p className="font-semibold mb-2">Eerste toegang moet nog worden ingesteld</p>
            <p>Voeg in Render bij Environment de geheime variabele <code>ALCHEMY_APP_PASSWORD</code> toe. Gebruik een uniek wachtwoord van minstens 14 tekens. Daarna kan Alchemy veilig worden geopend.</p>
          </div>
        )}
        <p className="text-center text-xs opacity-50 mt-8">Private by design · P&M Alchemy</p>
      </section>
    </main>
  );
};
