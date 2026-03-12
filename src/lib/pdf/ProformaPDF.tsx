import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Add a standard modern font
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#0D3B47',
    backgroundColor: '#ffffff'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E0D8',
    paddingBottom: 20,
    marginBottom: 20
  },
  companyName: {
    fontSize: 24,
    fontWeight: 700,
    color: '#306C3E'
  },
  companySub: {
    fontSize: 10,
    color: '#6e7a7e',
    marginTop: 4
  },
  proformaTitle: {
    fontSize: 18,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#6e7a7e',
    letterSpacing: 2
  },
  proformaDetails: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 8,
    color: '#3d4b4f'
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 30
  },
  infoCol: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#6e7a7e',
    letterSpacing: 1,
    marginBottom: 6
  },
  clientName: {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4
  },
  textRow: {
    marginBottom: 2,
    color: '#3d4b4f'
  },
  table: {
    width: '100%',
    marginBottom: 30
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F4F2EC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E0D8',
    borderTopWidth: 1,
    borderTopColor: '#E2E0D8',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  colDesc: { flex: 4, fontWeight: 600 },
  colQty: { flex: 1, textAlign: 'right', fontWeight: 600 },
  colPrice: { flex: 2, textAlign: 'right', fontWeight: 600 },
  colTotal: { flex: 2, textAlign: 'right', fontWeight: 600 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 4
  },
  itemDesc: {
    fontWeight: 600,
    marginBottom: 2
  },
  itemDetails: {
    fontSize: 9,
    color: '#6e7a7e',
    paddingRight: 10
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40
  },
  totalsBox: {
    width: '50%',
    backgroundColor: '#F4F2EC',
    padding: 15,
    borderRadius: 4
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  totalsRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E0D8'
  },
  totalLabel: {
    fontWeight: 600,
    color: '#6e7a7e'
  },
  mainTotalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#306C3E'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E0D8',
    paddingTop: 10,
    textAlign: 'center'
  },
  footerText: {
    fontSize: 8,
    color: '#6e7a7e',
    marginBottom: 2
  }
});

interface ProformaPDFProps {
  proforma: any;
  items: any[];
  client: any;
}

export default function ProformaPDF({ proforma, items, client }: ProformaPDFProps) {
  const clientNameDisplay = client?.company_name || 
    [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 
    client?.name || 
    'Cliente';

  const proformaNumber = proforma.id.split('-')[0].toUpperCase();
  const dateFormatted = new Date(proforma.created_at).toLocaleDateString('es-ES');
  const validUntilFormatted = new Date(proforma.valid_until).toLocaleDateString('es-ES');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>EstudioPro</Text>
            <Text style={styles.companySub}>Interior Design & Remodeling</Text>
          </View>
          <View>
             <Text style={styles.proformaTitle}>Quote</Text>
             <Text style={styles.proformaDetails}>Nº: {proformaNumber}</Text>
             <Text style={styles.proformaDetails}>Date: {dateFormatted}</Text>
             <Text style={styles.proformaDetails}>Valid until: {validUntilFormatted}</Text>
          </View>
        </View>

        {/* Client & Project */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Prepared For:</Text>
            <Text style={styles.clientName}>{clientNameDisplay}</Text>
            {client?.email && <Text style={styles.textRow}>{client.email}</Text>}
            {client?.phone && <Text style={styles.textRow}>{client.phone}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>Project Details:</Text>
            <Text style={styles.clientName}>{proforma.project_name}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty.</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          
          {items && items.map((item, i) => (
            <View wrap={false} key={i} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                {item.details && <Text style={styles.itemDetails}>{item.details}</Text>}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                ${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.colTotal}>
                ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text>${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Tax (16%)</Text>
              <Text>${proforma.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalsRowMain}>
              <Text style={[styles.totalLabel, { color: '#0D3B47' }]}>Estimated Total</Text>
              <Text style={styles.mainTotalValue}>${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Terms and Conditions</Text>
          <Text style={styles.footerText}>
            This quote represents an initial estimate and is subject to change following final on-site measurements.
          </Text>
          <Text style={styles.footerText}>
            Prices valid until the specified date. A 60% advance payment is required to start the project.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
