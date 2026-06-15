import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentContent } from "../content";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableLabel: {
    width: "35%",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f5f5f5",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  tableValue: {
    width: "65%",
    padding: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: "justify",
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 8,
    color: "#666",
    fontStyle: "italic",
  },
});

export function GrantPdfDocument({ content }: { content: DocumentContent }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{content.title}</Text>
        {content.subtitle && <Text style={styles.subtitle}>{content.subtitle}</Text>}

        <View style={styles.table}>
          {content.table.map((row) => (
            <View key={row.label} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{row.label}</Text>
              <Text style={styles.tableValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {content.sections.map((section, i) => (
          <View key={i}>
            {section.heading && <Text style={styles.sectionHeading}>{section.heading}</Text>}
            {section.paragraphs?.map((p, j) => (
              <Text key={j} style={styles.paragraph}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((b, j) => (
              <Text key={j} style={styles.bullet}>
                • {b}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.disclaimer}>{content.disclaimer}</Text>
      </Page>
    </Document>
  );
}
