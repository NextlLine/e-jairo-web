import { colors } from "@/styles/colors";

export function IconButton({
    icon,
    label,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}) {
    const isDisabled = disabled ?? !onClick;

    return (
        <button
            style={styles.button}
            onClick={onClick}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            onMouseDown={(e) => e.preventDefault()}
            onFocus={(e) => e.currentTarget.style.outline = "none"}
        >
            <span style={styles.icon}>{icon}</span>
            <span style={styles.label}>{label}</span>
        </button>
    );
}

const styles: Record<string, React.CSSProperties> = {
    button: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.cardBG,
        fontWeight: 600,
        color: colors.text,
        height: 40,
    },

    icon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        color: colors.primaryDark,
    },

    label: {
        fontSize: 14,
        whiteSpace: "nowrap",
    },
};
