import { auth } from "@/services/auth";
import type { Advertisement } from "@/types/advertisement";
import { baseURL } from "@/types/baseURL";
import { z } from "zod";

const createAdvertisementSchema = z.object({
    message: z.string().min(1, "Mensagem do aviso é obrigatória"),
});

export const createAddAdvertisementAction = async (message: string): Promise<Advertisement> => {
    const parsed = createAdvertisementSchema.safeParse({ message });

    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }

    const response = await fetch(`${baseURL.getBaseURL()}/advertisements`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth.getToken()}`,
        },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        let errorMessage = "Falha ao criar aviso";
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch { }
        throw new Error(errorMessage);
    }

    return await response.json();
};


export const loadAdvertisementsAction = async (): Promise<Advertisement[]> => {
    const response = await fetch(`${baseURL.getBaseURL()}/advertisements`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${auth.getToken()}`,
        },
    });

    if (!response.ok) {
        let errorMessage = "Falha ao carregar avisos";
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch { }
        throw new Error(errorMessage);
    }

    return await response.json();
};

export const deleteAdvertisementAction = async (id: string) => {
    try {


        const response = await fetch(`${baseURL.getBaseURL()}/advertisements/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.getToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error("Falha ao excluir aviso");
        }
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Erro ao excluir aviso");
    }
};
