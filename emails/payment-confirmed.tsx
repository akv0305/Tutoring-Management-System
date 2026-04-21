import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface PaymentConfirmedProps {
  parentName: string
  studentName: string
  orderRef: string
  amount: string
  classesScheduled: number
  confirmedAt: string
  dashboardUrl: string
}

export function PaymentConfirmed({
  parentName,
  studentName,
  orderRef,
  amount,
  classesScheduled,
  confirmedAt,
  dashboardUrl,
}: PaymentConfirmedProps) {
  return (
    <EmailLayout
      preview={`Payment confirmed — ${orderRef} — $${amount}`}
    >
      <Text style={emailStyles.heading}>Payment Confirmed</Text>

      <Text style={emailStyles.paragraph}>Hi {parentName || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        Your payment has been verified and confirmed. {classesScheduled} class
        {classesScheduled > 1 ? "es are" : " is"} now scheduled for{" "}
        {studentName}.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Order Reference</Text>
        <Text style={emailStyles.value}>{orderRef}</Text>

        <Text style={emailStyles.label}>Amount Paid</Text>
        <Text style={emailStyles.value}>${amount}</Text>

        <Text style={emailStyles.label}>Classes Scheduled</Text>
        <Text style={emailStyles.value}>
          {classesScheduled} class{classesScheduled > 1 ? "es" : ""}
        </Text>

        <Text style={emailStyles.label}>Confirmed On</Text>
        <Text style={emailStyles.value}>{confirmedAt}</Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={successTitle}>What happens next?</Text>
        <Text style={successText}>
          Your classes are now confirmed and visible in the dashboard. The
          teacher will share a meeting link before each session. You will
          receive a reminder email before each class.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View Classes
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        If you have any questions about your booking, please contact our
        support team.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const successTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#065F46",
  margin: "0 0 4px 0",
}
const successText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#065F46",
  margin: "0",
}

export default PaymentConfirmed
