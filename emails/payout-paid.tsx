import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface PayoutPaidProps {
  teacherName: string
  period: string
  netAmount: string
  paidAt: string
  dashboardUrl: string
}

export function PayoutPaid({
  teacherName,
  period,
  netAmount,
  paidAt,
  dashboardUrl,
}: PayoutPaidProps) {
  return (
    <EmailLayout
      preview={`Payout of $${netAmount} for ${period} has been processed`}
    >
      <Text style={emailStyles.heading}>Payout Processed</Text>

      <Text style={emailStyles.paragraph}>Hi {teacherName || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        Your payout for the period of {period} has been processed. Here are
        the details:
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Period</Text>
        <Text style={emailStyles.value}>{period}</Text>

        <Text style={emailStyles.label}>Net Amount</Text>
        <Text style={amountStyle}>${netAmount}</Text>

        <Text style={emailStyles.label}>Paid On</Text>
        <Text style={emailStyles.value}>{paidAt}</Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={noteTitle}>Bank Transfer</Text>
        <Text style={noteText}>
          The amount has been transferred to your registered bank account.
          Please allow 1–3 business days for it to reflect depending on
          your bank.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View Payout Details
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        If you have any questions about this payout, please contact our
        admin team.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const amountStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#065F46",
  margin: "0 0 12px 0",
}
const noteTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#1E3A5F",
  margin: "0 0 4px 0",
}
const noteText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#1E3A5F",
  margin: "0",
}

export default PayoutPaid
