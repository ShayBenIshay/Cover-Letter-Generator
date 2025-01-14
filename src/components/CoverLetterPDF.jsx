import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: "0.75in",
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
  },
  senderInfo: {
    marginBottom: 15,
  },
  date: {
    marginBottom: 15,
  },
  companyInfo: {
    marginBottom: 20,
  },
  content: {
    marginBottom: 20,
    textAlign: "justify",
  },
  closing: {
    marginTop: 20,
  },
  name: {
    fontFamily: "Times-Bold",
  },
  address: {
    marginTop: 2,
  },
});

const CoverLetterPDF = ({ coverLetter, companyName }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        {/* <View style={styles.senderInfo}>
          <Text style={styles.name}>Shay Ben Ishay</Text>
          <Text style={styles.address}>Haifa, Israel</Text>
          <Text>shaybishay@gmail.com</Text>
          <Text>0547573914</Text>
        </View> */}

        {/* <View style={styles.date}>
          <Text>
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View> */}

        {/* <View style={styles.companyInfo}>
          <Text>{companyName}</Text>
        </View> */}
      </View>

      <View style={styles.content}>
        <Text>{coverLetter}</Text>
      </View>

      {/* <View style={styles.closing}>
        <Text>Sincerely,</Text>
        <Text style={[styles.name, { marginTop: 15 }]}>Shay Ben Ishay</Text>
      </View> */}
    </Page>
  </Document>
);

export default CoverLetterPDF;
