import { useRef, useState } from "react";
import { colors } from "@/styles/colors";
import { FaBell, FaChevronLeft, FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";
import type { Advertisement } from "@/types/advertisement";
import Modal from "@/components/modal";
import { createAddAdvertisementAction, deleteAdvertisementAction } from "../home.action";
import { customStyle } from "@/styles/custom-style";

export function AdvertisementCarroussel({
    advertisements,
    onReload,
}: {
    advertisements: Advertisement[];
    onReload: () => Promise<void>;
}) {

    const scrollRef = useRef<HTMLDivElement>(null);
    const showArrows = advertisements.length > 3;
    const [showAddModal, setShowAddModal] = useState(false);
    const [advertisementMessage, setAdvertisementMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    function scroll(direction: "left" | "right") {
        if (!scrollRef.current) return;

        const cardWidth = 220;
        const scrollAmount = cardWidth * 2;

        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    }

    function handleAddAdvertisement() {
        setShowAddModal(true);
    }

    async function handleSubmitNewAd() {
        try {
            setError(null);
            setLoading(true);

            await createAddAdvertisementAction(advertisementMessage);
            setAdvertisementMessage("");
            await onReload();
            setShowAddModal(false);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro inesperado");
        } finally {
            setLoading(false);
        }
    }


    async function confirmDeleteAd() {
        if (!adToDelete) return;

        try {
            setDeleting(true);
            await deleteAdvertisementAction(adToDelete.id);

            await onReload();
            setAdToDelete(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao excluir");
        } finally {
            setDeleting(false);
        }
    }

    function handleDeleteAd(ad: Advertisement) {
        setAdToDelete(ad);
    }

    return (
        <section style={styles.section}>
            <div style={styles.header}>
                <h2 style={styles.sectionTitle}>
                    <FaBell /> Avisos
                </h2>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={styles.editBtn}
                        onClick={() => setIsEditing(prev => !prev)}
                    >
                        {isEditing ? "Concluir edição" : "Editar"}
                    </button>

                    <button
                        style={styles.addAdvBtn}
                        onClick={handleAddAdvertisement}
                    >
                        <FaPlus /> Adicionar Aviso
                    </button>
                </div>
            </div>


            <div style={styles.wrapper}>
                {showArrows && (
                    <button
                        style={{ ...styles.arrows, ...styles.arrowLeft }}
                        onClick={() => scroll("left")}
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.currentTarget.style.outline = "none"}
                    >
                        <FaChevronLeft />
                    </button>
                )}

                <div style={styles.cardRow} ref={scrollRef}>
                    {advertisements.length === 0 ? (
                        <div style={styles.simpleCard}>Nenhum aviso no momento</div>
                    ) : (
                        advertisements.map((ad) => (
                            <div key={ad.id} style={styles.simpleCard}>
                                {isEditing && (
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => handleDeleteAd(ad)}
                                        title="Excluir aviso"
                                    >
                                        <FaTrash />
                                    </button>
                                )}

                                <div>{ad.message}</div>
                            </div>
                        ))
                    )}
                </div>

                {showArrows && (
                    <button
                        style={{ ...styles.arrows, ...styles.arrowRight }}
                        onClick={() => scroll("right")}
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.currentTarget.style.outline = "none"}
                    >
                        <FaChevronRight />
                    </button>
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onRequestClose={() => setShowAddModal(false)}
            >
                <section style={styles.modalSectionTitle}>
                    <h2 >Adicionar Novo Aviso</h2>
                </section >

                <form style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                    <textarea
                        placeholder="Mensagem do aviso"
                        style={styles.input}
                        value={advertisementMessage}
                        onChange={(e) => setAdvertisementMessage(e.currentTarget.value)}
                    />

                    {error && <div style={customStyle.error}>{error}</div>}

                    <div style={{ display: "flex", justifyContent: "space-between", }}>
                        <button
                            type="button"
                            style={{ ...styles.cancelBtn, alignSelf: "flex-end" }}
                            onMouseDown={(e) => e.preventDefault()}
                            onFocus={(e) => e.currentTarget.style.outline = "none"}
                            onClick={() => setShowAddModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{ ...styles.addAdvBtn, alignSelf: "flex-end" }}
                            onMouseDown={(e) => e.preventDefault()}
                            onFocus={(e) => e.currentTarget.style.outline = "none"}
                            onClick={handleSubmitNewAd}
                        >
                            {loading ? "Criando..." : "Adicionar Aviso"}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!adToDelete}
                onRequestClose={() => setAdToDelete(null)}
                style={{ width: '100%' }}
            >
                <section style={styles.modalSectionTitle}>
                    <h2>Excluir Aviso</h2>
                </section>

                <div style={{ marginTop: 15, textAlign: "center" }}>
                    Tem certeza que deseja excluir este aviso?
                </div>

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 20
                }}>
                    <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={() => setAdToDelete(null)}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        style={styles.deleteConfirmBtn}
                        onClick={confirmDeleteAd}
                    >
                        {deleting ? "Excluindo..." : "Excluir"}
                    </button>
                </div>
            </Modal>

        </section>
    );
}

const styles: Record<string, React.CSSProperties> = {
    section: {
        marginBottom: 40,
        scrollbarColor: `${colors.primaryDark} ${colors.scrollbarBG}`,
    },
    sectionTitle: {
        marginBottom: 15,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: colors.primaryDark,
        fontWeight: 700,
    },
    modalSectionTitle: {
        display: "flex",
        justifyContent: "center",
        color: colors.primaryDark,
        fontWeight: 700,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    wrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    cardRow: {
        display: "flex",
        gap: 20,
        overflowX: "auto",
        scrollBehavior: "smooth",
        padding: "10px 40px",
    },
    simpleCard: {
        position: "relative",
        background: colors.cardBG,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.05)",
        minWidth: 200,
        fontWeight: 600,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    arrows: {
        height: "100%",
        width: 60,
        background: "transparent",
        color: colors.primaryDark,
        border: "none",
        cursor: "pointer",
        position: "absolute",
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    arrowLeft: {
        left: 0,
        background: `linear-gradient(to right, ${colors.background} 50%, rgba(255, 255, 255, 0))`,
    },

    arrowRight: {
        right: 0,
        background: `linear-gradient(to left, ${colors.background} 50%, rgba(255, 255, 255, 0))`,
    },
    addAdvBtn: {
        padding: "12px 22px",
        borderRadius: 10,
        border: "none",
        background: colors.primaryDark,
        color: colors.textButton,
        cursor: "pointer",
        fontWeight: 600,
    },
    cancelBtn: {
        padding: "12px 22px",
        borderRadius: 10,
        border: "none",
        background: colors.primaryDark,
        color: colors.textButton,
        cursor: "pointer",
        fontWeight: 600,
    },
    input: {
        width: "100%",
        height: 100,
        padding: 10,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        background: colors.background,
        fontSize: 14,
        resize: "none",
        boxSizing: "border-box",
    },
    deleteBtn: {
        position: "absolute",
        top: 8,
        right: 10,
        background: "transparent",
        border: "none",
        color: colors.danger,
        fontSize: 14,
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        zIndex: 2,
    },
    deleteConfirmBtn: {
        padding: "12px 22px",
        borderRadius: 10,
        border: "none",
        background: "#b91c1c",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
    },
    editBtn: {
        padding: "12px 22px",
        borderRadius: 10,
        border: `1px solid ${colors.primaryDark}`,
        background: "transparent",
        color: colors.primaryDark,
        cursor: "pointer",
        fontWeight: 600,
    },

};
