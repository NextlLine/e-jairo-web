import React from "react";
import { colors } from "@/styles/colors";

export function SimpleCard({ label }: { label: string }) {
  return <div style={styles.simpleCard}>{label}</div>;
}

export function IconCard({
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
    <div
      style={{
        ...styles.iconCard,
        ...(isDisabled ? styles.iconCardDisabled : null),
      }}
      onClick={isDisabled ? undefined : onClick}
      aria-disabled={isDisabled}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      <div style={styles.icon}>{icon}</div>
      <span style={styles.iconLabel}>{label}</span>
      {isDisabled && <span style={styles.disabledHint}>Em breve</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  simpleCard: {
    background: colors.cardBG,
    padding: 20,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.05)",
    minWidth: 200,
    fontWeight: 600,
    color: colors.text,
  },
  iconCard: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
    color: colors.textButton,
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    boxShadow: "0 6px 14px rgba(37, 99, 235, 0.25)",
    cursor: "pointer",
    transition: "opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease",
  },
  iconCardDisabled: {
    opacity: 0.45,
    filter: "saturate(0.55)",
    cursor: "not-allowed",
    boxShadow: "none",
    transform: "none",
  },
  icon: {
    fontSize: 30,
    marginBottom: 10,
  },
  iconLabel: {
    fontWeight: 600,
    textAlign: "center",
  },
  disabledHint: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    opacity: 0.9,
  },
};
