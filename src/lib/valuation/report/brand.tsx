import React from "react";
import { View, Text, Svg, Path, StyleSheet } from "@react-pdf/renderer";

/** Equitr report palette — aligned with app ink + gold. */
export const BRAND = {
  ink: "#06080d",
  inkSoft: "#12151c",
  text: "#1a1f2b",
  muted: "#4a5568",
  faint: "#8b95a8",
  line: "#d4dae4",
  lineSoft: "#e8ecf2",
  gold: "#c9a962",
  goldDark: "#9a7b33",
  goldSoft: "#f4efe3",
  white: "#ffffff",
  draft: "#6b4e12",
};

export const reportStyles = StyleSheet.create({
  page: {
    paddingTop: 62,
    paddingBottom: 68,
    paddingHorizontal: 54,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: BRAND.text,
    lineHeight: 1.55,
  },
  coverPage: {
    backgroundColor: BRAND.ink,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Times-Roman",
  },
  coverInner: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    justifyContent: "space-between",
  },
  coverTop: {},
  coverMarkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 48 },
  coverMarkLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND.gold, letterSpacing: 1.2 },
  coverMarkSub: { fontSize: 7.5, color: BRAND.faint, letterSpacing: 2, marginTop: 2 },
  coverEyebrow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.gold,
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  coverCompany: {
    fontSize: 34,
    fontFamily: "Times-Bold",
    color: BRAND.white,
    marginBottom: 8,
    lineHeight: 1.15,
  },
  coverSubtitle: { fontSize: 13, color: "#b8c0d0", marginBottom: 28, lineHeight: 1.45 },
  coverRule: { height: 2, backgroundColor: BRAND.gold, width: 72, marginBottom: 28 },
  coverMetaRow: { flexDirection: "row", marginBottom: 6 },
  coverMetaLabel: { width: 148, fontSize: 9.5, color: BRAND.faint },
  coverMetaValue: { fontSize: 9.5, fontFamily: "Times-Bold", color: BRAND.white },
  coverConclusion: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: BRAND.goldDark,
    backgroundColor: BRAND.inkSoft,
    padding: 22,
  },
  coverConclusionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND.gold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  coverConclusionValue: { fontSize: 36, fontFamily: "Times-Bold", color: BRAND.white },
  coverConclusionSub: { fontSize: 9.5, color: "#9aa3b5", marginTop: 6, lineHeight: 1.4 },
  coverDraft: {
    position: "absolute",
    bottom: 36,
    left: 54,
    right: 54,
    fontSize: 8,
    color: BRAND.goldDark,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },

  header: {
    position: "absolute",
    top: 28,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 0.75,
    borderBottomColor: BRAND.gold,
    paddingBottom: 6,
  },
  headerLeft: { fontSize: 8, color: BRAND.muted, fontFamily: "Helvetica" },
  headerRight: { fontSize: 8, color: BRAND.goldDark, fontFamily: "Helvetica-Bold" },

  footer: {
    position: "absolute",
    bottom: 32,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: BRAND.lineSoft,
    paddingTop: 7,
  },
  footerLeft: { fontSize: 7.5, color: BRAND.faint, fontFamily: "Helvetica", maxWidth: "70%" },
  footerRight: { fontSize: 7.5, color: BRAND.muted, fontFamily: "Helvetica" },

  h1: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    color: BRAND.ink,
    marginTop: 4,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  h1Rule: { height: 1.5, backgroundColor: BRAND.gold, width: 40, marginBottom: 12 },
  h2: { fontSize: 11, fontFamily: "Times-Bold", color: BRAND.ink, marginTop: 14, marginBottom: 6 },
  h3: { fontSize: 10, fontFamily: "Times-Bold", color: BRAND.goldDark, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 8, textAlign: "justify" },
  pTight: { marginBottom: 5, textAlign: "justify" },
  exhibit: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.muted,
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  note: { fontSize: 8.5, color: BRAND.muted, fontStyle: "italic", marginTop: 4, marginBottom: 8 },
  warn: {
    fontSize: 9,
    color: BRAND.draft,
    backgroundColor: BRAND.goldSoft,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.gold,
    padding: 8,
    marginBottom: 10,
  },

  table: { borderWidth: 0.5, borderColor: BRAND.line, marginTop: 4, marginBottom: 10 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BRAND.lineSoft },
  trHead: {
    flexDirection: "row",
    backgroundColor: BRAND.inkSoft,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.line,
  },
  trTotal: { flexDirection: "row", backgroundColor: BRAND.goldSoft, borderTopWidth: 0.5, borderTopColor: BRAND.gold },
  th: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: BRAND.white },
  thLight: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: BRAND.muted, backgroundColor: "#f0f2f6" },
  td: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.5, color: BRAND.text },
  tdBold: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.5, fontFamily: "Times-Bold", color: BRAND.ink },

  kvRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BRAND.lineSoft, paddingVertical: 4 },
  kvLabel: { width: "58%", color: BRAND.muted, fontSize: 9 },
  kvValue: { width: "42%", color: BRAND.ink, fontSize: 9, fontFamily: "Times-Bold", textAlign: "right" },

  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.lineSoft,
  },
  tocNum: { width: 24, fontSize: 9.5, fontFamily: "Times-Bold", color: BRAND.goldDark },
  tocLabel: { flex: 1, fontSize: 9.5, color: BRAND.text },
  tocSub: { flex: 1, fontSize: 9, color: BRAND.muted, paddingLeft: 24 },

  letterDate: { marginBottom: 16, fontSize: 10 },
  letterBlock: { marginBottom: 12 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: BRAND.text, paddingTop: 4, marginTop: 28, width: 200 },
});

export function EquitrMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M9 8h14a1.5 1.5 0 0 1 0 3H12v4h9.5a1.5 1.5 0 0 1 0 3H12v4h11a1.5 1.5 0 0 1 0 3H9a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
        fill={BRAND.gold}
      />
    </Svg>
  );
}

export function ReportHeader({
  company,
  section,
}: {
  company: string;
  section?: string;
}) {
  return (
    <View style={reportStyles.header} fixed>
      <Text style={reportStyles.headerLeft}>{company}</Text>
      {section ? <Text style={reportStyles.headerRight}>{section}</Text> : null}
    </View>
  );
}

export function ReportFooter({
  reportId,
  isDraft,
  pageLabel = "Page",
}: {
  reportId: string;
  isDraft: boolean;
  pageLabel?: string;
}) {
  return (
    <View style={reportStyles.footer} fixed>
      <Text style={reportStyles.footerLeft}>
        Equitr Valuations · {reportId}
        {isDraft ? " · Preliminary draft — subject to analyst review" : " · Confidential"}
      </Text>
      <Text
        style={reportStyles.footerRight}
        render={({ pageNumber, totalPages }) => `${pageLabel} ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <View wrap={false}>
      <Text style={reportStyles.h1}>{children}</Text>
      <View style={reportStyles.h1Rule} />
    </View>
  );
}
