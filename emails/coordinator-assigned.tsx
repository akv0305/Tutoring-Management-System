import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface CoordinatorAssignedProps {
  parentName: string
  studentName: string
  coordinatorName: string
  coordinatorEmail: string
  dashboardUrl: string
}

export function CoordinatorAssigned({
  parentName,
  studentName,
  coordinatorName,
  coordinatorEmail,
  dashboardUrl,
}: CoordinatorAssignedProps) {
  return (
    <EmailLayout
      preview={`A coordinator has been assigned for ${studentName}`}
    >
      <Text style={emailStyles.heading}>Coordinator Assigned</Text>

      <Text style={emailStyles.paragraph}>Hi {parentName || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        A coordinator has been assigned to help with {studentName}&apos;s
        learning journey at Expert Guru. They will be your primary point of
        contact for scheduling, class updates, and any questions.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Coordinator Name</Text>
        <Text style={emailStyles.value}>{coordinatorName}</Text>

        <Text style={emailStyles.label}>Coordinator Email</Text>
        <Text style={emailStyles.value}>{coordinatorEmail}</Text>

        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={nextTitle}>What happens next?</Text>
        <Text style={nextText}>
          Your coordinator will reach out to you within 24 hours to
          introduce themselves and help schedule {studentName}&apos;s first
          trial class. In the meantime, you can browse available teachers
          from your dashboard.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          Go to Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        If you need immediate assistance, feel free to contact us at
        info@expertguru.net.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const nextTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}
const nextText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default CoordinatorAssigned
