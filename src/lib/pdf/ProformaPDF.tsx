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
const LIGHT_GREY = '#f0f4f7';

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
    marginTop: 15,
    marginBottom: 20
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
  depositMessage: {
    fontSize: baseSize * 1.1,
    fontWeight: 700,
    marginVertical: 20,
    color: DARK_NAVY
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  totalsBox: {
    width: '40%'
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  totalsRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: DARK_NAVY
  },
  footer: {
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee'
  },
  thankYou: {
    fontSize: baseSize * 0.9,
    color: '#666666',
    marginBottom: 40
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signatureLineBox: {
    width: '45%'
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    height: 40,
    marginBottom: 8
  },
  signatureLabel: {
    fontSize: baseSize * 0.9,
    fontWeight: 700
  },
  notesBox: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fcfaf5',
    borderLeftWidth: 2,
    borderLeftColor: BRAND_BROWN,
    borderRadius: 2
  },
  notesLabel: {
    fontSize: baseSize * 0.8,
    fontWeight: 700,
    color: BRAND_BROWN,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  notesText: {
    fontSize: baseSize * 0.9,
    color: DARK_NAVY,
    fontStyle: 'italic',
    lineHeight: 1.4
  }
});

interface ProformaPDFProps {
  proforma: any;
  items: any[];
  client: any;
}

export default function ProformaPDF({ proforma, items, client }: ProformaPDFProps) {
  const user = proforma.users || {};
  const styles = getStyles(user?.pdf_font_size || 10);
  const clientNameDisplay = client?.company_name ||
    [client?.first_name, client?.last_name].filter(Boolean).join(' ') ||
    client?.name ||
    'Cliente';

  const proformaNumber = String(proforma.number || proforma.id.split('-')[0]).toUpperCase();
  const dateFormatted = new Date(proforma.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header: Company Info and Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: BRAND_BROWN }]}>{user.display_name?.toUpperCase()}</Text>
            {user.business_license && (
              <Text style={[styles.companyDetail, { color: BRAND_BROWN, fontSize: 8 }]}>
                {user.business_license}
              </Text>
            )}
            <Text style={styles.companyDetail}>{user.address}</Text>
            {user.phone && (
              <Text style={styles.companyDetail}>{user.phone}</Text>
            )}
            {user.email && (
              <Text style={styles.companyDetail}>{user.email}</Text>
            )}
          </View>
          <View>
            {user.logo_url ? (
              <Image src={user.logo_url} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8 }]}>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>Logo Placeholder</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Grid: Recipient and Summary Box */}
        <View style={styles.mainContentGrid}>
          <View style={styles.recipientBox}>
            <Text style={styles.label}>Recipient:</Text>
            <Text style={styles.recipientName}>{clientNameDisplay}</Text>
            {client?.street_1 && <Text style={styles.recipientDetail}>{client.street_1}</Text>}
            {client?.street_2 && <Text style={styles.recipientDetail}>{client.street_2}</Text>}
            <Text style={styles.recipientDetail}>
              {[client?.city, client?.province, client?.postal_code].filter(Boolean).join(', ')}
            </Text>
            {client?.phone && <Text style={[styles.recipientDetail, { marginTop: 10 }]}>Phone: {client.phone}</Text>}
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeaderText}>Estimate #{proformaNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>Sent on</Text>
              <Text>{dateFormatted}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666' }}>email</Text>
              <Text>{client?.email ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

          {items && items.map((item, i) => (
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

        {/* Deposit Note */}
        {proforma.required_deposit > 0 && (
          <Text style={[styles.depositMessage, { color: BRAND_BROWN }]}>
            A deposit of ${proforma.required_deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })} will be required to begin.
          </Text>
        )}

        {/* Notes Section */}
        {proforma.notes && (
          <View style={styles.notesBox} wrap={true}>
            <Text style={styles.notesLabel}>Notes & Special Conditions</Text>
            <PDFFormattedText text={proforma.notes} textStyle={styles.notesText} />
          </View>
        )}

        {/* Totals Section */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={{ color: '#666' }}>Subtotal</Text>
              <Text style={{ fontWeight: 700 }}>${proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>

            {(() => {
              const adjustments = (proforma.adjustments || []) as any[];
              const subtotal = proforma.subtotal;
              const discountAdjustments = adjustments.filter(a => a.type === 'discount');
              const totalDiscount = discountAdjustments.reduce((acc, adj) => {
                return acc + (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value);
              }, 0);
              const taxableAmount = subtotal - totalDiscount;

              let hasAdjustments = false;
              const rows = adjustments.map((adj: any, idx: number) => {
                hasAdjustments = true;
                const amount = adj.type === 'discount'
                  ? (adj.valueType === 'percentage' ? (subtotal * adj.value) / 100 : adj.value)
                  : (adj.valueType === 'percentage' ? (taxableAmount * adj.value) / 100 : adj.value);
                return (
                  <View key={idx} style={styles.totalsRow}>
                    <Text style={{ color: '#666' }}>
                      {adj.label} {adj.valueType === 'percentage' ? `(${adj.value}%)` : ''}
                    </Text>
                    <Text>{adj.type === 'discount' ? '-' : '+'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                  </View>
                );
              });

              if (!hasAdjustments) {
                return (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#666' }}>Tax (0.0%)</Text>
                    <Text>$0.00</Text>
                  </View>
                );
              }
              return rows;
            })()}

            <View style={styles.totalsRowFinal}>
              <Text style={{ fontWeight: 700, fontSize: 12 }}>Total</Text>
              <Text style={{ fontWeight: 700, fontSize: 14 }}>
                ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature & Footer Section */}
        <View style={styles.footer} wrap={false}>
          <View style={{ marginBottom: 20, width: 40 }} />
          {proforma.status === 'approved' && (proforma.client_signature_data || proforma.client_signed_name) ? (
            <View style={{ marginBottom: 30 }}>
              <Text style={[styles.label, { color: BRAND_BROWN }]}>Accepted & Signed By:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginTop: 10 }}>
                <View style={{ width: '45%' }}>
                  {proforma.client_signature_data ? (
                    <Image src={proforma.client_signature_data} style={{ width: 140, height: 60, objectFit: 'contain' }} />
                  ) : (
                    <Text style={{ fontSize: 18, fontWeight: 700, paddingBottom: 10 }}>{proforma.client_signed_name}</Text>
                  )}
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#000000', marginTop: 5 }} />
                  <Text style={{ fontSize: 9, marginTop: 5 }}>{clientNameDisplay}</Text>
                </View>
                <View style={{ width: '35%' }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, paddingBottom: 10 }}>
                    {proforma.approved_at ? new Date(proforma.approved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                  </Text>
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#000000', marginTop: 5 }} />
                  <Text style={{ fontSize: 9, marginTop: 5 }}>Date</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.signatureSection}>
              <View style={styles.signatureLineBox}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Signature:</Text>
              </View>
              <View style={styles.signatureLineBox}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date:</Text>
              </View>
            </View>
          )}

          {/*<Text style={[styles.thankYou, { marginTop: 20 }]}>
            Thank you for your business. Please contact us with any questions regarding this estimate {user.phone ? user.phone : ''}
            {proforma.id ? ` #${proforma.id.split('-')[0].toUpperCase()}` : ''} {user.display_name ? user.display_name : ''}
          </Text>*/}
        </View>

        {/* Terms and Conditions (Only at the end) */}
        <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 15 }}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: BRAND_BROWN, textTransform: 'uppercase', marginBottom: 6 }}>
            Terms and Conditions
          </Text>
          <Text style={{ fontSize: 8, color: '#666666', lineHeight: 1.4, textAlign: 'justify' }}>
            {proforma.users?.terms_conditions || "This quote represents an initial estimate and is subject to change following final on-site measurements. This quote is valid for the next 30 days, after which values may be subject to change. Sign must be requested to validate this Contract/Notice. Thank you for your business."}
          </Text>
        </View>

        {/* Minimal Fixed Footer for Page Numbering (Every Page) */}
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
