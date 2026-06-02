import { useEffect, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import type { CustomDocument } from "@/types/document";
import { deleteDocumentAction, loadDocuments, uploadDocumentAction, viewDocumentAction } from "./forms.action";
import { auth } from "@/services/auth";
import { customStyle } from "@/styles/custom-style";
import { colors } from "@/styles/colors";

export function FormsPage() {
    const [documentos, setDocuments] = useState<CustomDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [uploading, setUploading] = useState(false);
    const [viewingid, setViewingid] = useState<string | null>(null);
    const [deletingid, setDeletingid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [lastViewUrl, setLastViewUrl] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [currentCursor, setCurrentCursor] = useState<string | null>(null);
    const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);
    const documentLimit = 20;
    const canManageDocuments = auth.getRole() === "ADMIN" || auth.getRole() === "MASTER";
    const isBusy = loading || uploading;
    const busyLabel = loading ? "Carregando documentos..." : uploading ? "Enviando documento..." : "Processando...";
    
    async function handleFetchDocuments(cursor: string | null = null) {
        setLoading(true);
        setError(null);

        const normalizedName = nameFilter.trim();
        const normalizedCategory = categoryFilter.trim();

        try {
            const result = await loadDocuments({
                limit: documentLimit,
                cursor: cursor ?? undefined,
                name: normalizedName || undefined,
                category: normalizedCategory || undefined,
            });

            setDocuments(result.documents);
            setNextCursor(result.nextCursor);
            setCurrentCursor(cursor);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar documentos");
        } finally {
            setLoading(false);
        }
    }

    async function handleApplyFilters() {
        setCursorHistory([]);
        setCurrentCursor(null);
        await handleFetchDocuments();
    }

    async function handleNextPage() {
        if (!nextCursor) {
            return;
        }

        setCursorHistory((prev) => [...prev, currentCursor]);
        await handleFetchDocuments(nextCursor);
    }

    async function handlePreviousPage() {
        if (cursorHistory.length === 0) {
            return;
        }

        const previousCursor = cursorHistory[cursorHistory.length - 1] ?? null;

        setCursorHistory((prev) => prev.slice(0, -1));
        await handleFetchDocuments(previousCursor);
    }

    useEffect(() => {
        void handleFetchDocuments();
    }, []);

    async function handleUpload() {
        if (!canManageDocuments) {
            setError("Você não tem permissão para enviar documentos");
            return;
        }

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
            await handleFetchDocuments(currentCursor);
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

    async function handleViewDocument(id: string) {
        const previewTab = window.open("about:blank", "_blank");
        const popupBlocked = !previewTab;

        setViewingid(id);
        setError(null);

        try {
            const { viewUrl } = await viewDocumentAction(id);

            if (popupBlocked) {
                setLastViewUrl(viewUrl ?? null);
                setError("O navegador bloqueou a nova aba. Copie o link abaixo para abrir.");
            } else if (previewTab) {
                try {
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
            setViewingid(null);
        }
    }

    async function handleDeleteDocument(id: string) {
        if (!canManageDocuments) {
            setError("Você não tem permissão para excluir documentos");
            return;
        }

        const confirmed = window.confirm("Tem certeza que deseja excluir este documento?");

        if (!confirmed) {
            return;
        }

        setDeletingid(id);
        setError(null);
        setSuccess(null);

        try {
            await deleteDocumentAction(id);
            setSuccess("Documento excluído com sucesso");
            await handleFetchDocuments(currentCursor);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao excluir documento");
        } finally {
            setDeletingid(null);
        }
    }

    return (
        <div style={styles.page}>
            <style>{`@keyframes forms-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            {isBusy && (
                <div style={styles.loaderOverlay}>
                    <div style={styles.loaderCard}>
                        <div style={styles.spinner} />
                        <div style={styles.loaderTitle}>{busyLabel}</div>
                        <div style={styles.loaderSubtitle}>Aguarde um momento enquanto a operação é concluída.</div>
                    </div>
                </div>
            )}

            <div style={styles.toolbar}>
                <button
                    type="button"
                    onClick={() => void handleFetchDocuments(currentCursor)}
                    style={{
                        ...styles.secondaryButton,
                        ...styles.ghostButton,
                        minWidth: 140,
                        opacity: loading ? 0.38 : 1,
                    }}
                    disabled={loading}
                >
                    {loading ? "Buscando..." : "Atualizar"}
                </button>
            </div>

            <div style={styles.filterRow}>
                <div style={styles.filterBox}>
                    <span style={styles.searchPrefix}>NOME</span>
                    <input
                        type="text"
                        placeholder="Filtrar por nome"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        style={styles.filterInput}
                    />
                </div>

                <div style={styles.filterBox}>
                    <span style={styles.searchPrefix}>CATEGORIA</span>
                    <input
                        type="text"
                        placeholder="Filtrar por categoria"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={styles.filterInput}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => void handleApplyFilters()}
                    style={{ ...styles.secondaryButton, ...styles.primaryActionButton }}
                    disabled={loading}
                >
                    Aplicar filtro
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setNameFilter("");
                        setCategoryFilter("");
                        setCursorHistory([]);
                        setCurrentCursor(null);
                        void handleFetchDocuments();
                    }}
                    style={{ ...styles.secondaryButton, ...styles.ghostButton }}
                    disabled={loading}
                >
                    Limpar filtro
                </button>
            </div>

            {canManageDocuments && (
                <>
                    <div style={styles.uploadStrip}>
                        <div>
                            <div style={styles.uploadStripTitle}>Envio de documentos</div>
                            <div style={styles.uploadStripText}>Se precisar, abra o envio rápido sem perder o contexto dos filtros.</div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowUpload((prev) => !prev)}
                            style={{ ...styles.uploadToggleButton, ...styles.primaryActionButton }}
                        >
                            {showUpload ? "Fechar envio" : "Novo documento"}
                        </button>
                    </div>

                    {showUpload && (
                        <div style={styles.compactUploadPanel}>
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
                                    style={{
                                        ...styles.primaryButton,
                                        ...styles.primaryActionButton,
                                        opacity: uploading ? 0.38 : 1,
                                    }}
                                    disabled={uploading}
                                >
                                    {uploading ? "Enviando..." : "Enviar"}
                                </button>
                            </div>

                            {selectedFile && (
                                <div style={styles.fileSummary}>
                                    Selecionado: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {error && <div style={customStyle.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <div style={styles.card}>
                <div style={styles.paginationBar}>
                    <div style={styles.paginationInfoWrap}>
                        <div style={styles.paginationInfoTitle}>Resultados da consulta</div>
                        <div style={styles.paginationInfoText}>
                            Mostrando {documentos.length} documento{documentos.length === 1 ? "" : "s"} nesta consulta
                        </div>
                        <div style={styles.paginationBadge}>{nextCursor ? "Mais resultados disponíveis" : "Fim da lista"}</div>
                    </div>

                    <div style={styles.paginationActions}>
                        <button
                            type="button"
                            onClick={() => void handlePreviousPage()}
                            style={{
                                ...styles.paginationButton,
                                opacity: cursorHistory.length === 0 ? 0.35 : 1,
                            }}
                            disabled={loading || cursorHistory.length === 0}
                        >
                            Anterior
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleNextPage()}
                            style={{
                                ...styles.paginationButton,
                                opacity: !nextCursor ? 0.35 : 1,
                            }}
                            disabled={loading || !nextCursor}
                        >
                            Próxima
                        </button>
                    </div>
                </div>

                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.thIndex}>#</th>
                            <th style={styles.thDoc}>Documento</th>
                        </tr>
                    </thead>

                    <tbody>
                        {documentos.map((doc, index) => (
                            <tr key={doc.id} style={styles.tr}>
                                <td style={styles.indexCell}>
                                    <span style={styles.badge}>{index + 1}</span>
                                </td>

                                <td>
                                    <div style={styles.documentCell}>
                                        <div style={styles.documentHeaderRow}>
                                            <button
                                                type="button"
                                                onClick={() => void handleViewDocument(doc.id)}
                                                style={{
                                                    ...styles.linkButton,
                                                    opacity: viewingid === doc.id ? 0.38 : 1,
                                                }}
                                                disabled={viewingid === doc.id}
                                            >
                                                {viewingid === doc.id ? "Abrindo..." : (doc.nome || doc.name || "Documento").toUpperCase()}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteDocument(doc.id)}
                                                hidden={!canManageDocuments}
                                                style={{
                                                    ...styles.deleteButton,
                                                    opacity: deletingid === doc.id ? 0.38 : 1,
                                                }}
                                                disabled={deletingid === doc.id}
                                            >
                                                {deletingid === doc.id ? "Excluindo..." : "Excluir"}
                                            </button>
                                        </div>

                                        <span style={styles.documentKey}>{doc.arquivo || doc.key}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {lastViewUrl && (
                    <div style={styles.viewLinkBox}>
                        <div style={styles.viewLinkTitle}>URL de visualização</div>
                        <div style={styles.viewLinkRow}>
                            <input readOnly value={lastViewUrl} style={styles.viewLinkInput} />
                            <a href={lastViewUrl} target="_blank" rel="noopener noreferrer" style={styles.viewLinkAnchor}>Abrir</a>
                        </div>
                    </div>
                )}

                {documentos.length === 0 && (
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
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F7F8FC 0%, #FFFFFF 100%)",
        position: "relative",
    },

    hero: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 20,
        marginBottom: 18,
        padding: 22,
        borderRadius: 18,
        background: "linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%)",
        color: "white",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
        flexWrap: "wrap",
    },

        filterRow: {
            marginTop: 12,
            marginBottom: 12,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
        },

        filterBox: {
            flex: 1,
            minWidth: 260,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 12px",
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.5)",
            background: "#F8FAFC",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.05)",
        },

        filterInput: {
            ...customStyle.input,
            flex: 1,
            minWidth: 180,
            marginTop: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            boxShadow: "none",
            paddingLeft: 0,
            paddingRight: 0,
            fontSize: 15,
            fontWeight: 600,
        },

    heroEyebrow: {
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        opacity: 0.8,
        fontWeight: 700,
        marginBottom: 8,
    },

    heroTitle: {
        margin: 0,
        fontSize: 28,
        lineHeight: 1.1,
        fontWeight: 800,
        maxWidth: 620,
    },

    heroText: {
        margin: "10px 0 0",
        maxWidth: 680,
        color: "rgba(255,255,255,0.82)",
        fontSize: 14,
    },

    heroPillRow: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
        gap: 10,
        minWidth: 260,
    },

    heroPill: {
        padding: 14,
        borderRadius: 14,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
    },

    heroPillLabel: {
        display: "block",
        fontSize: 12,
        opacity: 0.8,
        marginBottom: 4,
    },

    heroPillValue: {
        fontSize: 20,
        fontWeight: 800,
    },

    panel: {
        marginBottom: 24,
        padding: 20,
        background: colors.cardBG,
        borderRadius: 18,
        border: `1px solid ${colors.border}`,
        boxShadow: "0 8px 26px rgba(15, 23, 42, 0.08)",
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

    ghostButton: {
        boxShadow: "none",
    },

    primaryActionButton: {
        boxShadow: "0 10px 22px rgba(29, 78, 216, 0.16)",
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
        borderRadius: 18,
        boxShadow: "0 8px 26px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    paginationBar: {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        borderBottom: `1px solid ${colors.border}`,
        background: "linear-gradient(180deg, #FBFDFF 0%, #F8FAFC 100%)",
    },

    paginationInfoWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },

    paginationInfoTitle: {
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 800,
        color: colors.text,
    },

    paginationInfoText: {
        fontSize: 13,
        color: colors.textLight,
        fontWeight: 500,
    },

    paginationBadge: {
        alignSelf: "flex-start",
        padding: "4px 8px",
        borderRadius: 999,
        background: "#E8F1FF",
        color: colors.primaryDark,
        fontSize: 11,
        fontWeight: 800,
    },

    paginationActions: {
        display: "flex",
        gap: 8,
        alignItems: "center",
    },

    paginationButton: {
        padding: "8px 12px",
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.cardBG,
        color: colors.text,
        fontWeight: 700,
        cursor: "pointer",
        minWidth: 96,
        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.04)",
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

    documentHeaderRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
    },

    tr: {
        borderBottom: `1px solid ${colors.border}`,
        transition: "background 0.2s ease",
    },

    toolbar: {
        marginTop: 20,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
    },

    uploadStrip: {
        marginTop: 12,
        marginBottom: 12,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px dashed ${colors.border}`,
        background: colors.cardBG,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
    },

    uploadStripTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: colors.text,
    },

    uploadStripText: {
        marginTop: 2,
        fontSize: 12,
        color: colors.textLight,
    },

    uploadToggleButton: {
        padding: "8px 12px",
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: "#F8FAFF",
        color: colors.primaryDark,
        fontWeight: 700,
        cursor: "pointer",
    },

    compactUploadPanel: {
        marginBottom: 12,
        padding: 14,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: colors.cardBG,
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
    },

    searchBox: {
        flex: 1,
        minWidth: 260,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 12px",
        borderRadius: 12,
        border: "2px solid rgba(29, 78, 216, 0.35)",
        background: "#FFFFFF",
        boxShadow: "0 10px 24px rgba(29, 78, 216, 0.12)",
    },

    searchPrefix: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: colors.primaryDark,
        whiteSpace: "nowrap",
    },

    searchInput: {
        ...customStyle.input,
        flex: 1,
        minWidth: 180,
        marginTop: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        boxShadow: "none",
        paddingLeft: 0,
        paddingRight: 0,
        fontSize: 15,
        fontWeight: 600,
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

    deleteButton: {
        marginTop: 6,
        padding: "6px 10px",
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: "#FFF1F0",
        color: "#B42318",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
    },

    empty: {
        padding: 30,
        textAlign: "center",
        color: colors.textLight,
        fontWeight: 500,
    },

    viewLinkBox: {
        padding: 14,
        borderTop: `1px solid ${colors.border}`,
        background: colors.inputBG,
    },

    viewLinkTitle: {
        marginBottom: 8,
        color: colors.text,
        fontWeight: 700,
    },

    viewLinkRow: {
        display: "flex",
        gap: 8,
        alignItems: "center",
    },

    viewLinkInput: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: colors.cardBG,
    },

    viewLinkAnchor: {
        color: colors.primaryDark,
        fontWeight: 700,
    },

    loaderOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
    },

    loaderCard: {
        width: "min(420px, calc(100vw - 32px))",
        padding: 24,
        borderRadius: 20,
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
    },

    spinner: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: `4px solid ${colors.border}`,
        borderTopColor: colors.primaryDark,
        animation: "forms-spin 0.9s linear infinite",
    },

    loaderTitle: {
        fontSize: 16,
        fontWeight: 800,
        color: colors.text,
    },

    loaderSubtitle: {
        fontSize: 13,
        color: colors.textLight,
        lineHeight: 1.5,
    },
};
