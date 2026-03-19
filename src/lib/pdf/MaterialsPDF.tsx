import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10, color: '#0D3B47', backgroundColor: '#ffffff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E0D8', paddingBottom: 20, marginBottom: 20 },
  companyName: { fontSize: 24, fontWeight: 700, color: '#306C3E' },
  companySub: { fontSize: 10, color: '#6e7a7e', marginTop: 4 },
  docTitle: { fontSize: 18, fontWeight: 700, textTransform: 'uppercase', color: '#6e7a7e', letterSpacing: 2 },
  docDetails: { fontSize: 10, textAlign: 'right', marginTop: 8, color: '#3d4b4f' },
  infoGrid: { flexDirection: 'row', marginBottom: 30 },
  infoCol: { flex: 1 },
  sectionTitle: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#6e7a7e', letterSpacing: 1, marginBottom: 6 },
  clientName: { fontSize: 12, fontWeight: 600, marginBottom: 4 },
  textRow: { marginBottom: 2, color: '#3d4b4f' },
  table: { width: '100%', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F4F2EC', borderBottomWidth: 1, borderBottomColor: '#E2E0D8', borderTopWidth: 1, borderTopColor: '#E2E0D8', paddingVertical: 8, paddingHorizontal: 4 },
  colDesc: { flex: 4, fontWeight: 600 },
  colQty: { flex: 1, textAlign: 'center', fontWeight: 600 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 4 },
  itemDesc: { fontWeight: 600, marginBottom: 2 },
  itemDetails: { fontSize: 9, color: '#6e7a7e', paddingRight: 10 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E2E0D8', paddingTop: 10, textAlign: 'center' },
  footerText: { fontSize: 8, color: '#6e7a7e', marginBottom: 2 }
});

interface MaterialsPDFProps {
  proforma: any;
  materials: any[];
  client: any;
}

export default function MaterialsPDF({ proforma, materials, client }: MaterialsPDFProps) {
  const clientNameDisplay = client?.company_name || 
    [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 
    client?.name || 'Cliente';

  const proformaNumber = proforma?.id?.split('-')[0].toUpperCase();
  const dateFormatted = new Date().toLocaleDateString('es-ES');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>EstudioPro</Text>
            <Text style={styles.companySub}>Interior Design & Remodeling</Text>
          </View>
          <View>
             <Text style={styles.docTitle}>Materials List</Text>
             <Text style={styles.docDetails}>Job Nº: {proformaNumber}</Text>
             <Text style={styles.docDetails}>Date: {dateFormatted}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Client / Job Site:</Text>
            <Text style={styles.clientName}>{clientNameDisplay}</Text>
            {client?.email && <Text style={styles.textRow}>{client.email}</Text>}
            {client?.phone && <Text style={styles.textRow}>{client.phone}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Project Details:</Text>
            <Text style={styles.clientName}>{proforma?.project_name}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Material</Text>
            <Text style={styles.colQty}>Qty.</Text>
          </View>
          
          {materials && materials.map((mat, i) => (
            <View wrap={false} key={i} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemDesc}>{mat.name}</Text>
                {mat.description && <Text style={styles.itemDetails}>{mat.description}</Text>}
              </View>
              <Text style={styles.colQty}>{mat.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This materials list corresponds to the project {proforma?.project_name}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
