import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface RefundUpdateProps {
  parentName: string
  studentName: string
  refundAmount: string
  originalAmount: string
  packageName?: string
  status: "APPROVED" | "REJECTED" | "PROCESSED"
  reason?: string
  dashboardUrl: string
}

const statusConfig = {
  APPROVED: {
    heading: "Refund Approved",
    preview: "Your refund request has been approved",
    message: "Your refund request has been reviewed and approved. The refund will be processed shortly.",
    boxColor: "#065F46",
    badgeText: "Approved",
    badgeStyle: {
      fontSize: "12px",
      fontWeight: "700" as const,
      color: "#065F46",
      backgroundColor: "#ECFDF5",
      border: "1px solid #A7F3D0",
      borderRadius: "6px",
      padding: "4px 10px",
      display: "inline-block" as const,
      margin: "0" as const,
    },
  },
  REJECTED: {
    heading: "Refund Request Update",
    preview: "Update on your refund request",
    message: "After careful review, we were unable to approve your refund request at this time.",
    boxColor: "#92400E",
    badgeText: "Not Approved",
    badgeStyle: {
      fontSize: "12px",
      fontWeight: "700" as const,
      color: "#92400E",
      backgroundColor: "#FFFBEB",
      border: "1px solid #FDE68A",
      borderRadius: "6px",
      padding: "4px 10px",
      display: "inline-block" as const,
      margin: "0" as const,
    },
  },
  PROCESSED: {
    heading: "Refund Processed",
    preview: "Your refund has been processed",
    message: "Your refund has been processed and the amount has been sent. Please allow a few business days for it to reflect in your account.",
    boxColor: "#0D9488",
    badgeText: "Processed",
    badgeStyle: {
      fontSize: "12px",
      fontWeight: "700" as const,
      color: "#0D9488",
      backgroundColor: "#F0FDFA",
      border: "1px solid #CCFBF1",
      borderRadius: "6px",
      padding: "4px 10px",
      display: "inline-block" as const,
      margin: "0" as const,
    },
  },
}

export function RefundUpdate({
  parentName,
  studentName,
  refundAmount,
  originalAmount,
  packageName,
  status,
  reason,
  dashboardUrl,
}: RefundUpdateProps) {
  const config = statusConfig[status]

  return (
    <EmailLayout preview={`${config.preview} — $${refundAmount}`}>
      <Text style={emailStyles.heading}>{config.heading}</Text>

      <Text style={emailStyles.paragraph}>Hi {parentName || "there"},</Text>

      <Text style={emailStyles.paragraph}>{config.message}</Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        {packageName && (
          <>
            <Text style={emailStyles.label}>Package</Text>
            <Text style={emailStyles.value}>{packageName}</Text>
          </>
        )}

        <Text style={emailStyles.label}>Original Payment</Text>
        <Text style={emailStyles.value}>${originalAmount}</Text>

        <Text style={emailStyles.label}>Refund Amount</Text>
        <Text style={emailStyles.value}>${refundAmount}</Text>

        <Hr style={divider} />

        <Text style={emailStyles.label}>Status</Text>
        <Text style={config.badgeStyle}>{config.badgeText}</Text>
      </Section>

      {reason && status === "REJECTED" && (
        <Section style={emailStyles.warningBox}>
          <Text style={noteTitle}>Note from our team</Text>
          <Text style={noteText}>{reason}</Text>
        </Section>
      )}

      {status === "PROCESSED" && (
        <Section style={emailStyles.infoBox}>
          <Text style={processedTitle}>Processing Details</Text>
          <Text style={processedText}>
            The refund of ${refundAmount} has been initiated. Depending on
            your bank, it may take 3–7 business days to appear in your
            account.
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View in Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        If you have any questions, please contact our support team at
        info@expertguru.net.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const divider: React.CSSProperties = {
  borderColor: "#E2E8F0",
  margin: "12px 0",
}
const noteTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#92400E",
  margin: "0 0 4px 0",
}
const noteText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400E",
  margin: "0",
}
const processedTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}
const processedText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default RefundUpdate
