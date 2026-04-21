import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface PaymentRejectedProps {
  parentName: string
  studentName: string
  orderRef: string
  amount: string
  classesCancelled: number
  reason?: string
  dashboardUrl: string
}

export function PaymentRejected({
  parentName,
  studentName,
  orderRef,
  amount,
  classesCancelled,
  reason,
  dashboardUrl,
}: PaymentRejectedProps) {
  return (
    <EmailLayout
      preview={`Payment not confirmed — ${orderRef} — action required`}
    >
      <Text style={emailStyles.heading}>Payment Not Confirmed</Text>

      <Text style={emailStyles.paragraph}>Hi {parentName || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        Unfortunately, we were unable to confirm your payment for{" "}
        {studentName}&apos;s classes. {classesCancelled} class
        {classesCancelled > 1 ? "es have" : " has"} been cancelled as a
        result.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Order Reference</Text>
        <Text style={emailStyles.value}>{orderRef}</Text>

        <Text style={emailStyles.label}>Amount</Text>
        <Text style={emailStyles.value}>${amount}</Text>

        <Text style={emailStyles.label}>Classes Cancelled</Text>
        <Text style={emailStyles.value}>
          {classesCancelled} class{classesCancelled > 1 ? "es" : ""}
        </Text>
      </Section>

      {reason && (
        <Section style={emailStyles.warningBox}>
          <Text style={reasonTitle}>Reason</Text>
          <Text style={reasonText}>{reason}</Text>
        </Section>
      )}

      <Section style={emailStyles.infoBox}>
        <Text style={helpTitle}>What can you do?</Text>
        <Text style={helpText}>
          If you believe this is an error, please contact our support team
          with your order reference. You can also rebook the classes and
          submit a new payment from your dashboard.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          Go to Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        Need help? Reply to this email or contact us at info@expertguru.net.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const reasonTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#92400E",
  margin: "0 0 4px 0",
}
const reasonText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400E",
  margin: "0",
}
const helpTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#1E3A5F",
  margin: "0 0 4px 0",
}
const helpText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#1E3A5F",
  margin: "0",
}

export default PaymentRejected
