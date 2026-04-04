import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { PDFFormattedText } from './components/PDFFormattedText';


// Add a standard modern font
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }
  ]
});

const BRAND_BROWN = '#ac8e68';
const DARK_NAVY = '#303030';

const getStyles = (baseSize: number = 10) => StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingHorizontal: 40,
    paddingBottom: 40,
    fontFamily: 'Inter',
    fontSize: baseSize,
    color: DARK_NAVY,
    backgroundColor: '#ffffff'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: baseSize * 2.5,
    alignItems: 'flex-start'
  },
  companyInfo: {
    width: '60%',
  },
  companyName: {
    fontSize: baseSize * 1.6,
    fontWeight: 700,
    marginBottom: 4,
    color: '#000000'
  },
  companyDetail: {
    fontSize: baseSize * 0.9,
    color: '#666666'
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain'
  },
  titleContainer: {
    marginBottom: baseSize * 2,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BROWN,
    paddingBottom: 10
  },
  title: {
    fontSize: baseSize * 2.4,
    fontWeight: 700,
    color: BRAND_BROWN,
    textTransform: 'uppercase'
  },
  mainContentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: baseSize * 3
  },
  recipientBox: {
    width: '50%'
  },
  label: {
    fontSize: baseSize * 0.8,
    fontWeight: 700,
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  recipientName: {
    fontSize: baseSize * 1.2,
    fontWeight: 700,
    marginBottom: 4
  },
  recipientDetail: {
    fontSize: baseSize,
    color: '#444444',
    marginBottom: 2
  },
  summaryBox: {
    width: '40%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  summaryHeader: {
    backgroundColor: BRAND_BROWN,
    paddingVertical: 8,
    paddingHorizontal: 15
  },
  summaryHeaderText: {
    color: '#ffffff',
    fontSize: baseSize * 1.2,
    fontWeight: 700
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  summaryTotalRow: {
    backgroundColor: BRAND_BROWN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15
  },
  summaryTotalLabel: {
    color: '#ffffff',
    fontSize: baseSize * 1.1,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  summaryTotalValue: {
    color: '#ffffff',
    fontSize: baseSize * 1.2,
    fontWeight: 700
  },
  table: {
    marginTop: baseSize * 2,
    marginBottom: baseSize * 2
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_BROWN,
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontWeight: 700
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  colDesc: { width: '55%', paddingRight: 10 },
  colQty: { width: '7%', textAlign: 'center' },
  colPrice: { width: '18%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: baseSize * 0.9,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  itemTitle: {
    fontSize: baseSize,
    fontWeight: 700,
    marginBottom: 4
  },
  itemDetails: {
    fontSize: baseSize * 0.9,
    color: '#666666',
    lineHeight: 1.4
  },
  notesBox: {
    marginTop: baseSize * 3,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_BROWN
  },
  notesTitle: {
    fontSize: baseSize * 0.8,
    fontWeight: 700,
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  notesText: {
    fontSize: baseSize * 0.9,
    color: '#444444',
    lineHeight: 1.4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10
  },
  footerText: {
    fontSize: baseSize * 0.8,
    color: '#999999'
  }
});

interface InvoicePDFProps {
  invoice: any;
  proforma: any;
  client: any;
  user: any;
}

export default function InvoicePDF({ invoice, proforma, client, user }: InvoicePDFProps) {
  const styles = getStyles(user?.pdf_font_size || 10);
  const clientNameDisplay = client?.company_name ||
    [client?.first_name, client?.last_name].filter(Boolean).join(' ') ||
    client?.name ||
    'Cliente';

  const dateFormatted = new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dueDateFormatted = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Company Info and Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: BRAND_BROWN }]}>{user?.display_name?.toUpperCase() || 'COMPANY NAME'}</Text>
            {user?.business_license && (
              <Text style={[styles.companyDetail, { color: BRAND_BROWN, fontSize: 8 }]}>
                {user.business_license}
              </Text>
            )}
            <Text style={styles.companyDetail}>{user?.address || ''}</Text>
            {user?.phone && <Text style={styles.companyDetail}>{user.phone}</Text>}
            {user?.email && <Text style={styles.companyDetail}>{user.email}</Text>}
          </View>
          <View>
            {user?.logo_url ? (
              <Image src={user.logo_url} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8 }]}>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>No Logo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Invoice</Text>
        </View>

        {/* Content Grid */}
        <View style={styles.mainContentGrid}>
          <View style={styles.recipientBox}>
            <Text style={styles.label}>Bill To:</Text>
            <Text style={styles.recipientName}>{clientNameDisplay}</Text>
            {client?.street_1 && <Text style={styles.recipientDetail}>{client.street_1}</Text>}
            <Text style={styles.recipientDetail}>
              {[client?.city, client?.province, client?.postal_code].filter(Boolean).join(', ')}
            </Text>
            {client?.email && <Text style={[styles.recipientDetail, { marginTop: 10 }]}>{client.email}</Text>}
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderText}>Invoice #{invoice.invoice_number}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Project</Text>
              <Text style={{ fontSize: 9 }}>{proforma?.project_name || 'N/A'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Date</Text>
              <Text>{dateFormatted}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Amount Due</Text>
              <Text style={styles.summaryTotalValue}>
                ${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Product/Service</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {proforma?.proforma_items && proforma.proforma_items
            .filter((item: any) => !item.is_excluded)
            .map((item: any, i: number) => (
              <View key={i} style={styles.tableRow} wrap={true}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  {item.details && <PDFFormattedText text={item.details} textStyle={styles.itemDetails} />}
                </View>
                <Text style={[styles.recipientDetail, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.recipientDetail, styles.colPrice]}>
                  ${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.recipientDetail, styles.colTotal, { fontWeight: 700 }]}>
                  ${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
        </View>
        <View style={styles.mainContentGrid}>
          <View style={styles.recipientBox}></View>
          <View style={styles.summaryBox}>
            {/* Add a summary row for the table */}
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Subtotal</Text>
              <Text style={{ fontSize: 9 }}>
                ${proforma?.proforma_items.reduce((acc: number, item: any) => acc + item.total_price, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Tax</Text>
              <Text style={{ fontSize: 9 }}>
                ${invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Discount</Text>
              <Text style={{ fontSize: 9 }}>
                ${invoice.discount_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Total</Text>
              <Text style={{ fontSize: 9 }}>
                ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
        {/* Notes Section if exists */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes</Text>
            <PDFFormattedText text={invoice.notes} textStyle={styles.notesText} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business. Please contact us if you have any questions.</Text>
          <Text style={[styles.footerText, { marginTop: 5 }]}>Payments are due by the specified date. Overdue invoices may incur penalties.</Text>
        </View>

        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 40,
            right: 40,
            paddingTop: 10,
            textAlign: 'right'
          }}
          fixed
        >
          <Text
            style={{ fontSize: 8, color: '#666666', textAlign: 'right' }}
            render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} / ${totalPages}`
            )}
          />
        </View>
      </Page>
    </Document>
  );
}
