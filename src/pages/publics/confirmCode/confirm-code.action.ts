import { router } from "@/router";
import { baseURL } from "@/types/baseURL";

export async function confirmCodeAction(email: string, code: string) {
  if (!email || !code) {
    throw new Error("Email e código são obrigatórios");
  }
  

  const response = await fetch(`${baseURL.getBaseURL()}/auth/confirm-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Erro ao confirmar conta");
  }

  router.navigate("/home");
}
