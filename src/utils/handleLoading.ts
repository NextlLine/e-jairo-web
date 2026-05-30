export async function handleLoading(
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    lambda: () => Promise<void>
) {
    try {
        setError(null);
        setLoading(true);

        await lambda();
    } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
        setLoading(false);
    }
}