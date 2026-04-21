import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface ClassCompletedProps {
  parentName: string
  studentName: string
  teacherName: string
  subject: string
  scheduledAt: string
  duration: number
  topicCovered?: string
  sessionNotes?: string
  isTrial: boolean
  dashboardUrl: string
}

export function ClassCompleted({
  parentName,
  studentName,
  teacherName,
  subject,
  scheduledAt,
  duration,
  topicCovered,
  sessionNotes,
  isTrial,
  dashboardUrl,
}: ClassCompletedProps) {
  return (
    <EmailLayout
      preview={`${studentName}'s ${subject} class with ${teacherName} is complete`}
    >
      <Text style={emailStyles.heading}>Class Completed</Text>

      <Text style={emailStyles.paragraph}>
        Hi {parentName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        {studentName}&apos;s {subject} class with {teacherName} has been
        completed successfully. Here&apos;s a summary of the session:
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Subject</Text>
        <Text style={emailStyles.value}>{subject}</Text>

        <Text style={emailStyles.label}>Teacher</Text>
        <Text style={emailStyles.value}>{teacherName}</Text>

        <Text style={emailStyles.label}>Date &amp; Time</Text>
        <Text style={emailStyles.value}>{scheduledAt}</Text>

        <Text style={emailStyles.label}>Duration</Text>
        <Text style={emailStyles.value}>{duration} minutes</Text>

        {topicCovered && (
          <>
            <Hr style={divider} />
            <Text style={emailStyles.label}>Topic Covered</Text>
            <Text style={emailStyles.value}>{topicCovered}</Text>
          </>
        )}

        {sessionNotes && (
          <>
            <Text style={emailStyles.label}>Session Notes</Text>
            <Text style={notesText}>{sessionNotes}</Text>
          </>
        )}
      </Section>

      <Section style={ratingBox}>
        <Text style={ratingTitle}>How was the session?</Text>
        <Text style={ratingText}>
          Your feedback helps us maintain the highest quality tutoring.
          Please take a moment to rate this class from your dashboard.
        </Text>
        <Section style={buttonContainer}>
          <Button href={dashboardUrl} style={rateButton}>
            Rate This Class
          </Button>
        </Section>
      </Section>

      {isTrial && (
        <Section style={emailStyles.infoBox}>
          <Text style={trialTitle}>What&apos;s Next?</Text>
          <Text style={trialText}>
            Now that the trial is complete, your coordinator will reach out to
            discuss how it went and help you choose the right package to
            continue {studentName}&apos;s learning journey.
          </Text>
        </Section>
      )}

      {!isTrial && (
        <Text style={emailStyles.mutedText}>
          You can view the full class history and session details in your
          dashboard at any time.
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.secondaryButton}>
          View in Dashboard
        </Button>
      </Section>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "16px 0",
}

const divider: React.CSSProperties = {
  borderColor: "#E2E8F0",
  margin: "12px 0",
}

const notesText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#1E293B",
  fontStyle: "italic",
  backgroundColor: "#F8FAFC",
  borderLeft: "3px solid #0D9488",
  padding: "8px 12px",
  margin: "0 0 12px 0",
}

const ratingBox: React.CSSProperties = {
  backgroundColor: "#FFF7ED",
  border: "1px solid #FFEDD5",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "16px 0",
  textAlign: "center" as const,
}

const ratingTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#C2410C",
  margin: "0 0 4px 0",
}

const ratingText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#C2410C",
  margin: "0 0 8px 0",
}

const rateButton: React.CSSProperties = {
  backgroundColor: "#F59E0B",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  borderRadius: "10px",
  padding: "10px 24px",
  display: "inline-block",
}

const trialTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}

const trialText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default ClassCompleted
