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
const SUCCESS_GREEN = '#10b981';

const getStyles = (baseSize: number) => StyleSheet.create({
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
    marginBottom: 25,
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
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: SUCCESS_GREEN,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  title: {
    fontSize: baseSize * 2.4,
    fontWeight: 700,
    color: SUCCESS_GREEN,
    textTransform: 'uppercase'
  },
  receiptNumber: {
    fontSize: baseSize,
    fontWeight: 700,
    color: '#999999'
  },
  mainContentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
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
    borderColor: SUCCESS_GREEN + '40',
    backgroundColor: SUCCESS_GREEN + '05',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  amountLabel: {
    fontSize: baseSize * 0.9,
    fontWeight: 700,
    color: SUCCESS_GREEN,
    textTransform: 'uppercase',
    marginBottom: 5
  },
  amountValue: {
    fontSize: baseSize * 2,
    fontWeight: 700,
    color: SUCCESS_GREEN
  },
  detailsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb'
  },
  detailLabel: {
    fontSize: baseSize * 0.9,
    fontWeight: 700,
    color: '#999999',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: baseSize,
    fontWeight: 700,
    color: DARK_NAVY
  },
  confirmationBox: {
    marginTop: 40,
    padding: 20,
    backgroundColor: SUCCESS_GREEN + '08',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SUCCESS_GREEN + '20'
  },
  confirmationText: {
    fontSize: baseSize * 1.2,
    fontWeight: 700,
    color: SUCCESS_GREEN,
    textAlign: 'center'
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

interface PaymentPDFProps {
  payment: any;
  proforma: any;
  client: any;
  user: any;
}

export default function PaymentPDF({ payment, proforma, client, user }: PaymentPDFProps) {
  const styles = getStyles(user?.pdf_font_size || 10);
  const clientNameDisplay = client?.company_name ||
    [client?.first_name, client?.last_name].filter(Boolean).join(' ') ||
    client?.name ||
    'Cliente';

  const dateFormatted = new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const paymentMethod = payment.payment_method?.toUpperCase() || 'N/A';
  const paymentType = payment.type === 'deposit' ? 'Deposit' : 'Payment';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: SUCCESS_GREEN }]}>{user?.display_name?.toUpperCase() || 'COMPANY NAME'}</Text>
            <Text style={styles.companyDetail}>{user?.address || ''}</Text>
            {user?.phone && <Text style={styles.companyDetail}>{user.phone}</Text>}
            {user?.email && <Text style={styles.companyDetail}>{user.email}</Text>}
          </View>
          <View>
            {user?.logo_url ? (
              <Image src={user.logo_url} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', border: '1px dashed #cccccc', borderRadius: 8 }]}>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>No Logo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Payment Receipt</Text>
          <Text style={styles.receiptNumber}>REC-{payment.id.split('-')[0].toUpperCase()}</Text>
        </View>

        {/* Content */}
        <View style={styles.mainContentGrid}>
          <View style={styles.recipientBox}>
            <Text style={styles.label}>Received From:</Text>
            <Text style={styles.recipientName}>{clientNameDisplay}</Text>
            {client?.street_1 && <Text style={styles.recipientDetail}>{client.street_1}</Text>}
            <Text style={styles.recipientDetail}>
              {[client?.city, client?.province, client?.postal_code].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.amountLabel}>Amount Received</Text>
            <Text style={styles.amountValue}>
              ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Payment Date</Text>
            <Text style={styles.detailValue}>{dateFormatted}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{paymentMethod}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{paymentType} for {proforma?.project_name || 'Project'}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>Job #{proforma?.number}</Text>
          </View>
        </View>

        {payment.notes && (
          <View style={{ marginTop: 25 }}>
            <Text style={styles.label}>Notes</Text>
            <PDFFormattedText text={payment.notes} textStyle={{ fontSize: 9, color: '#666' }} />
          </View>
        )}

        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationText}>Thank you for your payment!</Text>
          <Text style={{ fontSize: 9, color: SUCCESS_GREEN, marginTop: 5, opacity: 0.8 }}>This is a formal confirmation of the funds received.</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Electronic Document - No signature required</Text>
          <Text style={[styles.footerText, { marginTop: 5 }]}>© {new Date().getFullYear()} {user?.display_name || 'The Company'}</Text>
        </View>

      </Page>
    </Document>
  );
}
