import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface ClassCancelledProps {
  recipientName: string
  studentName: string
  teacherName: string
  subject: string
  scheduledAt: string
  duration: number
  cancelledBy: "student" | "teacher"
  cancelReason?: string
  dashboardUrl: string
}

export function ClassCancelled({
  recipientName,
  studentName,
  teacherName,
  subject,
  scheduledAt,
  duration,
  cancelledBy,
  cancelReason,
  dashboardUrl,
}: ClassCancelledProps) {
  const isTeacherCancel = cancelledBy === "teacher"

  return (
    <EmailLayout
      preview={
        isTeacherCancel
          ? `Class cancelled by ${teacherName} — ${subject}`
          : `Class cancelled by ${studentName} — ${subject}`
      }
    >
      <Text style={emailStyles.heading}>Class Cancelled</Text>

      <Text style={emailStyles.paragraph}>
        Hi {recipientName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        {isTeacherCancel
          ? `${teacherName} has cancelled the upcoming ${subject} class with ${studentName}. We apologise for the inconvenience.`
          : `${studentName}'s parent has cancelled the upcoming ${subject} class with ${teacherName}.`}
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Subject</Text>
        <Text style={emailStyles.value}>{subject}</Text>

        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        <Text style={emailStyles.label}>Teacher</Text>
        <Text style={emailStyles.value}>{teacherName}</Text>

        <Text style={emailStyles.label}>Originally Scheduled</Text>
        <Text style={emailStyles.value}>{scheduledAt}</Text>

        <Text style={emailStyles.label}>Duration</Text>
        <Text style={emailStyles.value}>{duration} minutes</Text>

        <Hr style={divider} />

        <Text style={emailStyles.label}>Cancelled By</Text>
        <Text style={cancelBadge}>
          {isTeacherCancel ? "Teacher" : "Student / Parent"}
        </Text>

        {cancelReason && (
          <>
            <Text style={emailStyles.label}>Reason</Text>
            <Text style={emailStyles.value}>{cancelReason}</Text>
          </>
        )}
      </Section>

      {isTeacherCancel && (
        <Section style={emailStyles.warningBox}>
          <Text style={warningTitle}>What Happens Next?</Text>
          <Text style={warningText}>
            Our team will work with you to reschedule this class at a convenient
            time. You can also book a new slot directly from your dashboard.
          </Text>
        </Section>
      )}

      {!isTeacherCancel && (
        <Text style={emailStyles.mutedText}>
          The class slot has been freed up on your schedule. No further action
          is needed from your end.
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          {isTeacherCancel ? "Book New Class" : "View My Schedule"}
        </Button>
      </Section>
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

const cancelBadge: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#DC2626",
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

export default ClassCancelled
