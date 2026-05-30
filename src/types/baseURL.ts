
class BaseURL {
    private url: string;
    
    constructor() {
        const baseUrl = import.meta.env.VITE_BASE_URL;

        if (!baseUrl) {
            throw new Error("URL da API não configurada");
        }

        this.url = baseUrl;
    }

    public getBaseURL(): string {
        return this.url;
    }
}

export const baseURL = new BaseURL();