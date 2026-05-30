import React, { type CSSProperties } from "react";
import { router } from "@/router";
import { signInAction } from "./signin.action";
import { customStyle } from "@/styles/custom-style";
import { colors } from "@/styles/colors";
import Favicon from "@/utils/exportFavIcon"; 
import { handleLoading } from "@/utils/handleLoading";

export default function SignInPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSignIn() {
    handleLoading(setError, setLoading, () => signInAction(email, password));
  }

  function handleSignUp() {
    router.navigate("/signup");
  }

  return (
    <div style={customStyle.containerCenter}>
      <form
        style={customStyle.form}
        onSubmit={(e) => e.preventDefault()}
        autoComplete="on"
      >
        <img src={Favicon} style={customStyle.logo} />

        <h1 style={customStyle.title}>
          Bem-vindo ao <span style={style.titleSpan}>E-JAIRO</span>
        </h1>

        <label style={customStyle.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            style={customStyle.input}
            placeholder="Digite seu email"
            autoComplete="email"
          />
        </label>

        <label style={customStyle.label}>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            style={customStyle.input}
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </label>

        {error && <div style={customStyle.error}>{error}</div>}

        <button
          type="button"
          style={{ ...customStyle.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div style={customStyle.footer}>
          <span>Não tem uma conta?</span>
          <button
            type="button"
            style={customStyle.primaryButton}
            onClick={handleSignUp}
          >
            Cadastre-se
          </button>
        </div>
      </form>
    </div>
  );
}

const style: Record<string, CSSProperties> = {
  titleSpan: {
    color: colors.primary,
  },
};