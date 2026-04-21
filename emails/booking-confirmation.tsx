import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface BookingConfirmationProps {
  parentName: string
  studentName: string
  teacherName: string
  subject: string
  scheduledSlots: string[]
  duration: number
  totalClasses: number
  isTrial: boolean
  orderRef?: string
  totalAmount?: string
  dashboardUrl: string
}

export function BookingConfirmation({
  parentName,
  studentName,
  teacherName,
  subject,
  scheduledSlots,
  duration,
  totalClasses,
  isTrial,
  orderRef,
  totalAmount,
  dashboardUrl,
}: BookingConfirmationProps) {
  return (
    <EmailLayout
      preview={
        isTrial
          ? `Trial class booked for ${studentName}`
          : `${totalClasses} class${totalClasses > 1 ? "es" : ""} booked for ${studentName}`
      }
    >
      <Text style={emailStyles.heading}>
        {isTrial ? "Trial Class Booked!" : "Booking Confirmed"}
      </Text>

      <Text style={emailStyles.paragraph}>
        Hi {parentName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        {isTrial
          ? `A free trial class has been scheduled for ${studentName}. Here are the details:`
          : `${totalClasses} class${totalClasses > 1 ? "es have" : " has"} been booked for ${studentName}. Here are the details:`}
      </Text>

      <Section style={emailStyles.infoBox}>
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

        {isTrial && (
          <>
            <Hr style={divider} />
            <Text style={trialBadge}>FREE TRIAL</Text>
          </>
        )}

        {!isTrial && orderRef && (
          <>
            <Hr style={divider} />
            <Text style={emailStyles.label}>Order Reference</Text>
            <Text style={emailStyles.value}>{orderRef}</Text>

            <Text style={emailStyles.label}>Total Amount</Text>
            <Text style={emailStyles.value}>{totalAmount}</Text>

            <Text style={emailStyles.label}>Payment Status</Text>
            <Text style={pendingBadge}>Pending Confirmation</Text>
          </>
        )}
      </Section>

      {!isTrial && (
        <Section style={emailStyles.warningBox}>
          <Text style={warningTitle}>Payment Required</Text>
          <Text style={warningText}>
            Your classes are reserved but will only be confirmed once payment is
            verified. Please complete the payment at your earliest convenience.
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View in Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        {isTrial
          ? "A coordinator will be in touch to help prepare for the trial session."
          : "If you have any questions about your booking, please contact our support team."}
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

const trialBadge: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "700",
  color: "#0D9488",
  backgroundColor: "#F0FDFA",
  border: "1px solid #CCFBF1",
  borderRadius: "6px",
  padding: "4px 10px",
  display: "inline-block",
  margin: "0",
}

const pendingBadge: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
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

export default BookingConfirmation
