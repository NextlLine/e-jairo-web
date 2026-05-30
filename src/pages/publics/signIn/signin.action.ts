import { router } from "@/router";
import { auth } from "@/services/auth";
import { z } from "zod";
import { baseURL } from "@/types/baseURL";

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const signInAction = async (email: string, password: string) => {
  const parsed = signInSchema.safeParse({ email, password });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }


  let response: Response;

  try {
    response = await fetch(`${baseURL.getBaseURL()}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Erro de conexão com o servidor");
  }

  if (!response.ok) {
    let message = "Falha ao realizar login";

    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch { }
    if (message === "UserNotConfirmedException") {
      router.navigate("/confirm-code", { state: { email } });
      return;
    }

    throw new Error(message);
  }

  const data = await response.json();
  console.log("Resposta do servidor:", data);

  const accessToken = data.accessToken;

  if (!accessToken) {
    throw new Error("Token não recebido do servidor");
  }

  auth.signIn(accessToken);

  router.navigate("/home");
};