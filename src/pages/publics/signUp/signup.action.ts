import { router } from "@/router";
import { baseURL } from "@/types/baseURL";

export const signUpAction = async (
    email: string,
    password: string,
    confirmPassword: string,
    name: string,
    teamCode: string,
    profession: string
) => {
    if (!email || !password || !confirmPassword || !name || !teamCode || !profession) {
        throw new Error("Preencha todos os campos");
    }

    if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem");
    }

    if (password.length < 8) {
        throw new Error("A senha deve ter no mínimo 8 caracteres");
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
        throw new Error("A senha deve conter pelo menos um caractere especial");
    }

    const response = await fetch(`${baseURL.getBaseURL()}/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            password,
            name,
            teamCode: teamCode,
            profession,
        }),
    });

    if (!response.ok) {
        let errorMessage = "Erro ao criar conta";

        try {
            const data = await response.json();

            if (data?.message) {
                errorMessage = data.message.replace(/^.*?:\s*/, "");
            }
        } catch {
            errorMessage = await response.text();
        }

        throw new Error(errorMessage);
    }

    router.navigate("/confirm-code", { state: { email } });
};
