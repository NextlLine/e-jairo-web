import React from "react";
import { colors } from "@/styles/colors";
import { customStyle } from "@/styles/custom-style";
import {
  FaUsers,
  FaBaby,
  FaUserInjured,
  FaNotesMedical,
  FaClipboardList,
  FaExclamationTriangle,
  FaFileAlt,
  FaSyringe,
  FaChartPie,
} from "react-icons/fa";
import { IconCard } from "@/components/card";
import { AdvertisementCarroussel } from "@/pages/privates/home/components/AdvertisementSection";
import type { Advertisement } from "@/types/advertisement";
import { loadAdvertisementsAction } from "./home.action";

export default function HomePage() {

  const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);

  async function handleLoadAdvertisements() {
    const ads = await loadAdvertisementsAction();
    setAdvertisements(ads); 
  }


  React.useEffect(() => {
    handleLoadAdvertisements();
  }, []);

  return (
    <div style={customStyle.page}>

      <AdvertisementCarroussel
        advertisements={advertisements}
        onReload={handleLoadAdvertisements}
      />

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><FaChartPie /> Grupos / Estatísticas</h2>
        <div style={styles.grid}>
          <IconCard icon={<FaBaby />} label="Crianças < 2 anos" />
          <IconCard icon={<FaUserInjured />} label="Gestantes" />
          <IconCard icon={<FaNotesMedical />} label="Comorbidades" />
          <IconCard icon={<FaUsers />} label="Grupo Diversos" />
          <IconCard icon={<FaClipboardList />} label="Consolidado Geral" />
          <IconCard icon={<FaChartPie />} label="Tabela de Grupos" />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><FaExclamationTriangle /> Pendências</h2>
        <div style={styles.grid}>
          <IconCard icon={<FaFileAlt />} label="Pendências Ativas" />
          <IconCard icon={<FaClipboardList />} label="Pendências Arquivadas" />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}><FaSyringe /> Área Clínica</h2>
        <div style={styles.grid}>
          <IconCard icon={<FaNotesMedical />} label="Prontuários" />
          <IconCard icon={<FaSyringe />} label="Vacinação" />
          <IconCard icon={<FaFileAlt />} label="Receituário" />
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 15,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: colors.primaryDark,
    fontWeight: 700,
  },
  searchBox: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.inputBG,
    minWidth: 220,
    fontSize: 14,
    color: colors.text,
    outline: "none",
  },
  searchBtn: {
    padding: "12px 22px",
    borderRadius: 10,
    border: "none",
    background: colors.primaryDark,
    color: colors.textButton,
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 20,
  },
};
