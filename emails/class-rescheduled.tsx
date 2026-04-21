import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface ClassRescheduledProps {
  recipientName: string
  studentName: string
  teacherName: string
  subject: string
  previousSchedule: string
  newSchedule: string
  duration: number
  rescheduledBy: "student" | "teacher"
  reason?: string
  dashboardUrl: string
}

export function ClassRescheduled({
  recipientName,
  studentName,
  teacherName,
  subject,
  previousSchedule,
  newSchedule,
  duration,
  rescheduledBy,
  reason,
  dashboardUrl,
}: ClassRescheduledProps) {
  const isTeacherReschedule = rescheduledBy === "teacher"

  return (
    <EmailLayout
      preview={`${subject} class rescheduled to ${newSchedule}`}
    >
      <Text style={emailStyles.heading}>Class Rescheduled</Text>

      <Text style={emailStyles.paragraph}>
        Hi {recipientName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        {isTeacherReschedule
          ? `${teacherName} has rescheduled the ${subject} class with ${studentName}. Please review the updated schedule below.`
          : `${studentName}'s parent has rescheduled the ${subject} class with ${teacherName}. Please review the updated schedule below.`}
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Subject</Text>
        <Text style={emailStyles.value}>{subject}</Text>

        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        <Text style={emailStyles.label}>Teacher</Text>
        <Text style={emailStyles.value}>{teacherName}</Text>

        <Text style={emailStyles.label}>Duration</Text>
        <Text style={emailStyles.value}>{duration} minutes</Text>

        <Hr style={divider} />

        <Text style={emailStyles.label}>Previous Schedule</Text>
        <Text style={previousStyle}>{previousSchedule}</Text>

        <Text style={emailStyles.label}>New Schedule</Text>
        <Text style={newStyle}>{newSchedule}</Text>

        {reason && (
          <>
            <Hr style={divider} />
            <Text style={emailStyles.label}>Reason</Text>
            <Text style={emailStyles.value}>{reason}</Text>
          </>
        )}
      </Section>

      <Text style={emailStyles.mutedText}>
        Please make a note of the updated date and time. If this new schedule
        doesn&apos;t work for you, please contact us or reschedule from your
        dashboard.
      </Text>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View Updated Schedule
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

const previousStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#94A3B8",
  textDecoration: "line-through",
  margin: "0 0 12px 0",
}

const newStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 12px 0",
}

export default ClassRescheduled
