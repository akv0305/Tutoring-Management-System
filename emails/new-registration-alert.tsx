import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface NewRegistrationAlertProps {
  recipientName: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  studentName: string
  studentGrade: string
  subjects: string[]
  coordinatorName?: string
  scheduleNotes?: string
  dashboardUrl: string
}

export function NewRegistrationAlert({
  recipientName,
  parentName,
  parentEmail,
  parentPhone,
  studentName,
  studentGrade,
  subjects,
  coordinatorName,
  scheduleNotes,
  dashboardUrl,
}: NewRegistrationAlertProps) {
  return (
    <EmailLayout preview={`New registration — ${studentName} (${parentName})`}>
      <Text style={emailStyles.heading}>New Parent Registration</Text>

      <Text style={emailStyles.paragraph}>Hi {recipientName || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        A new parent has registered on Expert Guru. Here are the details:
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={sectionTitle}>Parent Details</Text>

        <Text style={emailStyles.label}>Name</Text>
        <Text style={emailStyles.value}>{parentName}</Text>

        <Text style={emailStyles.label}>Email</Text>
        <Text style={emailStyles.value}>{parentEmail}</Text>

        {parentPhone && (
          <>
            <Text style={emailStyles.label}>Phone</Text>
            <Text style={emailStyles.value}>{parentPhone}</Text>
          </>
        )}
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={sectionTitle}>Student Details</Text>

        <Text style={emailStyles.label}>Student Name</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        <Text style={emailStyles.label}>Grade</Text>
        <Text style={emailStyles.value}>{studentGrade}</Text>

        <Text style={emailStyles.label}>Subjects Requested</Text>
        <Text style={emailStyles.value}>
          {subjects.length > 0 ? subjects.join(", ") : "Not specified"}
        </Text>

        {scheduleNotes && (
          <>
            <Text style={emailStyles.label}>Schedule Notes</Text>
            <Text style={emailStyles.value}>{scheduleNotes}</Text>
          </>
        )}
      </Section>

      <Section style={emailStyles.infoBox}>
        <Text style={assignmentTitle}>Coordinator Assignment</Text>
        <Text style={assignmentText}>
          {coordinatorName
            ? `Assigned to ${coordinatorName}. Please reach out to the parent within 24 hours to schedule a trial class.`
            : "No coordinator has been assigned yet. Please assign one from the admin dashboard."}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View in Dashboard
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        This is an automated alert from Expert Guru.
      </Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}
const sectionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#1E3A5F",
  margin: "0 0 8px 0",
}
const assignmentTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}
const assignmentText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default NewRegistrationAlert
