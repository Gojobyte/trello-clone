import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Icon } from "#/features/app/Icon";
import { AuthLayout } from "#/features/app/AuthLayout";
import { AuthError } from "#/routes/login";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionPending && session?.user) {
      navigate({ to: "/boards" });
    }
  }, [sessionPending, session, navigate]);

  const passwordOk = password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordOk) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? "Erreur lors de l'inscription.");
      return;
    }
    window.location.href = "/boards";
  }

  return (
    <AuthLayout
      switchLink={
        <Link to="/login" className="btn btn--ghost">
          Déjà un compte ? Se connecter
        </Link>
      }
    >
      <div className="auth-form">
        <div className="landing-eyebrow" style={{ marginBottom: 32 }}>
          Créer un compte
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
          Bienvenue.
        </h1>
        <p className="text-muted" style={{ margin: "0 0 32px", fontSize: 14.5 }}>
          Créez votre espace en 30 secondes. Aucune carte bancaire requise.
        </p>

        <form className="col" style={{ gap: 14 }} onSubmit={handleSubmit} noValidate>
          <div>
            <label className="label" htmlFor="name">
              Nom complet
            </label>
            <input
              id="name"
              className="input"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Léa Marchand"
            />
          </div>
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
            <div
              className="row"
              style={{ gap: 6, marginTop: 8, fontSize: 12 }}
            >
              <Icon
                name="check"
                size={13}
                stroke={3}
                style={{
                  color: passwordOk ? "var(--green)" : "var(--text-subtle)",
                }}
              />
              <span
                style={{
                  color: passwordOk ? "var(--green)" : "var(--text-muted)",
                }}
              >
                Au moins 8 caractères
              </span>
            </div>
          </div>

          <label
            className="row text-sm"
            style={{
              gap: 8,
              color: "var(--text-muted)",
              alignItems: "flex-start",
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              J'accepte les{" "}
              <span
                style={{
                  color: "var(--text)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                conditions
              </span>{" "}
              et la{" "}
              <span
                style={{
                  color: "var(--text)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                politique de confidentialité
              </span>
              .
            </span>
          </label>

          {error && <AuthError message={error} />}

          <button
            className="btn btn--primary btn--lg"
            type="submit"
            disabled={loading || !accepted}
            style={{ justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Création du compte…" : "Créer mon compte"}
            {!loading && <Icon name="arrow" size={14} />}
          </button>
        </form>

        <p
          className="text-subtle text-xs"
          style={{ marginTop: 32, textAlign: "center" }}
        >
          Gratuit. Aucune carte requise. Fermez votre compte quand vous voulez.
        </p>
      </div>
    </AuthLayout>
  );
}
