import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import type { CustomDocument } from "@/types/document";
import { loadDocuments, uploadDocumentAction, viewDocumentAction } from "./forms.action";
import { customStyle } from "@/styles/custom-style";
import { colors } from "@/styles/colors";

export function FormsPage() {
    const [busca, setBusca] = useState("");
    const [documentos, setDocuments] = useState<CustomDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState("");
    const [uploading, setUploading] = useState(false);
    const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [lastViewUrl, setLastViewUrl] = useState<string | null>(null);
    
    async function handleFetchDocuments() {
        setLoading(true);
        setError(null);

        try {
            setDocuments(await loadDocuments());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar documentos");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void handleFetchDocuments();
    }, []);

    const documentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const listaDocumentos = Array.isArray(documentos) ? documentos : [];

        if (!termo) {
            return listaDocumentos;
        }

        return listaDocumentos.filter((doc) => {
            return doc.nome.toLowerCase().includes(termo) || doc.arquivo.toLowerCase().includes(termo);
        });
    }, [busca, documentos]);

    async function handleUpload() {
        if (!selectedFile) {
            setError("Selecione um arquivo para enviar");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            await uploadDocumentAction({
                file: selectedFile,
                category,
            });

            setSuccess("Documento enviado e metadata salva com sucesso");
            setSelectedFile(null);
            setCategory("");
            await handleFetchDocuments();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao enviar documento");
        } finally {
            setUploading(false);
        }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
    }

    async function handleViewDocument(documentId: string) {
        console.log("Gerando URL de visualização para documento ID:", documentId);
        // tenta abrir a aba imediatamente (sincrono) — pode ser bloqueado
        const previewTab = window.open("about:blank", "_blank");
        const popupBlocked = !previewTab;

        setViewingDocumentId(documentId);
        setError(null);

        try {
            // chamada de diagnóstico (ajusta lastPayload no UI se desejar)
            const { viewUrl } = await viewDocumentAction(documentId);

            if (popupBlocked) {
                // popup foi bloqueado — informar usuário e mostrar link para copiar
                setLastViewUrl(viewUrl ?? null);
                setError("O navegador bloqueou a nova aba. Copie o link abaixo para abrir.");
            } else if (previewTab) {
                try {
                    // escreve um placeholder enquanto a URL carrega
                    previewTab.document.title = "Abrindo documento...";
                    previewTab.location.href = viewUrl;
                    previewTab.opener = null;
                } catch (navErr) {
                    previewTab.close();
                    setLastViewUrl(viewUrl ?? null);
                    setError("Não foi possível redirecionar a aba automaticamente. Copie o link abaixo.");
                }
            }
        } catch (err) {
            if (previewTab) {
                try { previewTab.close(); } catch (_) { /* ignore */ }
            }

            setError(err instanceof Error ? err.message : "Erro ao gerar URL de visualização");
        } finally {
            setViewingDocumentId(null);
        }
    }

    return (
        <div style={styles.page}>

            <div style={styles.panel}>
                <div style={styles.panelHeader}>
                    <div>
                        <h2 style={styles.title}>Enviar documento</h2>
                        <p style={styles.subtitle}>Gere a URL pré-assinada, envie direto ao S3 e salve a metadata no backend.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleFetchDocuments()}
                        style={{ ...styles.secondaryButton, opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? "Atualizando..." : "Atualizar lista"}
                    </button>
                </div>

                <div style={styles.formRow}>
                    <label style={styles.field}>
                        <span style={styles.label}>Arquivo</span>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            style={styles.fileInput}
                        />
                    </label>

                    <label style={styles.field}>
                        <span style={styles.label}>Categoria</span>
                        <input
                            type="text"
                            placeholder="Opcional"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={customStyle.input}
                        />
                    </label>

                    <button
                        type="button"
                        onClick={() => void handleUpload()}
                        style={{ ...styles.primaryButton, opacity: uploading ? 0.7 : 1 }}
                        disabled={uploading}
                    >
                        {uploading ? "Enviando..." : "Enviar documento"}
                    </button>
                </div>

                {selectedFile && (
                    <div style={styles.fileSummary}>
                        Selecionado: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
                    </div>
                )}

                {error && <div style={customStyle.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}
            </div>

            <input
                type="text"
                placeholder="Digite o nome do arquivo"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={customStyle.input}
            />

            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.thIndex}>#</th>
                            <th style={styles.thDoc}>Documento</th>
                        </tr>
                    </thead>

                    <tbody>
                        {documentosFiltrados.map((doc, index) => (
                            <tr key={doc.id} style={styles.tr}>
                                <td style={styles.indexCell}>
                                    <span style={styles.badge}>{index + 1}</span>
                                </td>

                                <td>
                                    <div style={styles.documentCell}>
                                        <button
                                            type="button"
                                            onClick={() => void handleViewDocument(doc.id)}
                                            style={{
                                                ...styles.linkButton,
                                                opacity: viewingDocumentId === doc.id ? 0.75 : 1,
                                            }}
                                            disabled={viewingDocumentId === doc.id}
                                        >
                                            {viewingDocumentId === doc.id ? "Abrindo..." : doc.nome.toUpperCase()}
                                        </button>

                                        <span style={styles.documentKey}>{doc.arquivo}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {lastViewUrl && (
                    <div style={{ padding: 12, borderTop: `1px solid ${colors.border}`, background: colors.inputBG, marginTop: 12 }}>
                        <div style={{ marginBottom: 8, color: colors.text }}>URL de visualização (copie se necessário):</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input readOnly value={lastViewUrl} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${colors.border}` }} />
                            <a href={lastViewUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primaryDark, fontWeight: 700 }}>Abrir</a>
                        </div>
                    </div>
                )}

                {documentosFiltrados.length === 0 && (
                    <div style={styles.empty}>
                        Nenhum documento encontrado
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        padding: 30,
        maxWidth: 1000,
        margin: "0 auto",
    },

    panel: {
        marginBottom: 24,
        padding: 20,
        background: colors.cardBG,
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    },

    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 16,
        flexWrap: "wrap",
    },

    title: {
        margin: 0,
        color: colors.text,
        fontSize: 20,
        fontWeight: 700,
    },

    subtitle: {
        margin: "6px 0 0",
        color: colors.textLight,
        fontSize: 14,
    },

    formRow: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
        alignItems: "end",
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },

    label: {
        fontSize: 14,
        fontWeight: 600,
        color: colors.text,
    },

    fileInput: {
        ...customStyle.input,
        padding: 9,
    },

    primaryButton: {
        padding: "12px 18px",
        borderRadius: 10,
        border: "none",
        background: colors.primaryDark,
        color: colors.textButton,
        fontWeight: 700,
        cursor: "pointer",
        height: 42,
    },

    secondaryButton: {
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.inputBG,
        color: colors.text,
        fontWeight: 600,
        cursor: "pointer",
    },

    fileSummary: {
        marginTop: 14,
        fontSize: 14,
        color: colors.textLight,
    },

    success: {
        marginTop: 14,
        padding: 10,
        borderRadius: 8,
        background: "#E9F9EF",
        color: "#126B3A",
        fontSize: 14,
        textAlign: "center",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
    },

    card: {
        marginTop: 25,
        background: colors.cardBG,
        borderRadius: 14,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    theadRow: {
        background: colors.primaryDark,
        color: "white",
        textAlign: "left",
    },

    thIndex: {
        padding: "14px 18px",
        width: 70,
    },

    thDoc: {
        padding: "14px 18px",
    },

    documentCell: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "flex-start",
        padding: "12px 18px",
    },

    tr: {
        borderBottom: `1px solid ${colors.border}`,
        transition: "background 0.2s ease",
    },

    indexCell: {
        padding: "12px 18px",
    },

    badge: {
        background: colors.primaryDark,
        color: "white",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
    },

    linkButton: {
        padding: 0,
        border: "none",
        background: "transparent",
        color: colors.primaryDark,
        fontWeight: 700,
        fontSize: 14,
        textAlign: "left",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 3,
    },

    documentKey: {
        fontSize: 12,
        color: colors.textLight,
        wordBreak: "break-word",
    },

    empty: {
        padding: 30,
        textAlign: "center",
        color: colors.textLight,
        fontWeight: 500,
    },
};
