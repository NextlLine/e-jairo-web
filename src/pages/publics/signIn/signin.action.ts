import { router } from "@/router";
import { auth } from "@/services/auth";
import { z } from "zod";
import { baseURL } from "@/types/baseURL";

type SignInResponse = {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  role?: "ADMIN" | "MASTER" | "USER";
};

async function readResponseBody(response: Response): Promise<unknown> {
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    return null;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

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

    const errorData = await readResponseBody(response);

    if (typeof errorData === "string" && errorData.trim()) {
      message = errorData;
    } else if (errorData && typeof errorData === "object" && "message" in errorData) {
      const responseMessage = (errorData as { message?: unknown }).message;
      if (typeof responseMessage === "string" && responseMessage.trim()) {
        message = responseMessage;
      }
    }

    if (message === "UserNotConfirmedException") {
      router.navigate("/confirm-code", { state: { email } });
      return;
    }

    throw new Error(message);
  }

  const responseBody = await readResponseBody(response);

  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("Resposta inválida do servidor ao realizar login");
  }

  const data = responseBody as SignInResponse;
  console.log("Resposta do servidor:", data);

  const accessToken = data.accessToken;
  const role = data.role;

  if (!accessToken) {
    throw new Error("Token não recebido do servidor");
  }

  auth.signIn(accessToken, role);

  router.navigate("/home");
};