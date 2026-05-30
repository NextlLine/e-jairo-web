import React from "react";
import { confirmCodeAction } from "./confirm-code.action";
import { customStyle } from "@/styles/custom-style";
import { useLocation } from "react-router-dom";
import Favicon from "@/utils/exportFavIcon";
import { handleLoading } from "@/utils/handleLoading";

export default function ConfirmCodePage() {
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email;

  const [email, setEmail] = React.useState(emailFromState || "");
  const [code, setCode] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    handleLoading(setError, setLoading, () => confirmCodeAction(email, code));
  }

  return (
    <div style={customStyle.containerCenter}>
      <form
        style={customStyle.form}
        onSubmit={(e) => e.preventDefault()}
      >
        <img src={Favicon} style={customStyle.logo} />
        <h2 style={customStyle.title}>Confirmar conta</h2>

        {!emailFromState && (
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
        )}

        <label style={customStyle.label}>
          Código de confirmação
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            style={customStyle.input}
            placeholder="Digite o código recebido"
          />
        </label>

        {error && <div style={customStyle.error}>{error}</div>}

        <button
          type="button"
          style={{ ...customStyle.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar"}
        </button>
      </form>
    </div>
  );
}
