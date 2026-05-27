import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Icon } from "#/features/app/Icon";
import { AuthLayout } from "#/features/app/AuthLayout";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionPending && session?.user) {
      navigate({ to: "/boards" });
    }
  }, [sessionPending, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message ?? "Email ou mot de passe incorrect.");
      return;
    }
    window.location.href = "/boards";
  }

  return (
    <AuthLayout
      switchLink={
        <Link to="/register" className="btn btn--ghost">
          Pas de compte ? S'inscrire
        </Link>
      }
    >
      <div className="auth-form">
        <div className="landing-eyebrow" style={{ marginBottom: 32 }}>
          Se connecter
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          Content de vous revoir.
        </h1>
        <p className="text-muted" style={{ margin: "0 0 32px", fontSize: 14.5 }}>
          Reprenez là où vous vous étiez arrêté.
        </p>

        <form className="col" style={{ gap: 14 }} onSubmit={handleSubmit} noValidate>
          <div>
            <label className="label" htmlFor="email">
              Email professionnel
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@atelier.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
            />
          </div>

          {error && <AuthError message={error} />}

          <button
            className="btn btn--primary btn--lg"
            type="submit"
            disabled={loading}
            style={{ justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
            {!loading && <Icon name="arrow" size={14} />}
          </button>
        </form>

        <p
          className="text-subtle text-xs"
          style={{ marginTop: 32, textAlign: "center" }}
        >
          Protégé par chiffrement de bout en bout · ISO 27001
        </p>
      </div>
    </AuthLayout>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        borderRadius: 6,
        border: "1px solid var(--red-soft)",
        background: "var(--red-soft)",
        color: "var(--red)",
        padding: "8px 12px",
        fontSize: 13,
      }}
    >
      <span
        style={{
          marginTop: 1,
          display: "inline-flex",
          height: 16,
          width: 16,
          flex: "none",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "var(--red)",
          color: "white",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        !
      </span>
      {message}
    </div>
  );
}
