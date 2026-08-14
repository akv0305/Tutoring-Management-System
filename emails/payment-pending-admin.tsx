import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface PaymentPendingAdminProps {
  adminName?: string
  studentName: string
  teacherName: string
  subject: string
  totalClasses: number
  scheduledSlots: string[]
  duration: number
  orderRef: string
  totalAmount: string
  walletDeduction?: string
  couponDiscount?: string
  amountDue: string
  parentName: string
  parentEmail: string
  dashboardUrl: string
}

export function PaymentPendingAdmin({
  adminName,
  studentName,
  teacherName,
  subject,
  totalClasses,
  scheduledSlots,
  duration,
  orderRef,
  totalAmount,
  walletDeduction,
  couponDiscount,
  amountDue,
  parentName,
  parentEmail,
  dashboardUrl,
}: PaymentPendingAdminProps) {
  return (
    <EmailLayout
      preview={`Payment pending — ${orderRef} — ${parentName} booked ${totalClasses} class${totalClasses > 1 ? "es" : ""}`}
    >
      <Text style={emailStyles.heading}>Payment Pending — Action Required</Text>

      <Text style={emailStyles.paragraph}>
        Hi {adminName || "Admin"},
      </Text>

      <Text style={emailStyles.paragraph}>
        A parent has booked {totalClasses} class{totalClasses > 1 ? "es" : ""} and
        the payment is pending confirmation. The payment method selected is bank
        transfer / offline payment. Please verify and confirm once received.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Order Reference</Text>
        <Text style={emailStyles.value}>{orderRef}</Text>

        <Text style={emailStyles.label}>Parent</Text>
        <Text style={emailStyles.value}>
          {parentName} ({parentEmail})
        </Text>

        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        <Text style={emailStyles.label}>Teacher</Text>
        <Text style={emailStyles.value}>{teacherName}</Text>

        <Text style={emailStyles.label}>Subject</Text>
        <Text style={emailStyles.value}>{subject}</Text>

        <Text style={emailStyles.label}>
          {totalClasses > 1 ? "Scheduled Slots" : "Scheduled At"}
        </Text>
        {scheduledSlots.map((slot, i) => (
          <Text key={i} style={emailStyles.value}>{slot}</Text>
        ))}

        <Text style={emailStyles.label}>Duration</Text>
        <Text style={emailStyles.value}>{duration} minutes per class</Text>

        <Hr style={divider} />

        <Text style={emailStyles.label}>Total Amount</Text>
        <Text style={emailStyles.value}>{totalAmount}</Text>

        {walletDeduction && (
          <>
            <Text style={emailStyles.label}>Wallet Applied</Text>
            <Text style={emailStyles.value}>-{walletDeduction}</Text>
          </>
        )}

        {couponDiscount && (
          <>
            <Text style={emailStyles.label}>Coupon Discount</Text>
            <Text style={emailStyles.value}>-{couponDiscount}</Text>
          </>
        )}

        <Text style={emailStyles.label}>Amount Due (Pending)</Text>
        <Text style={pendingAmount}>{amountDue}</Text>
      </Section>

      <Section style={emailStyles.warningBox}>
        <Text style={warningTitle}>Action Required</Text>
        <Text style={warningText}>
          The classes are reserved with status &quot;Pending Payment&quot;. Once you verify
          the payment, please confirm it from the admin dashboard. If payment is not
          received, the booking will auto-expire after the class time passes.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View in Admin Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        This is an automated notification from Expert Guru.
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

const pendingAmount: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#D97706",
  margin: "0 0 12px 0",
}

const warningTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#92400E",
  margin: "0 0 4px 0",
}

const warningText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400E",
  margin: "0",
}

export default PaymentPendingAdmin
