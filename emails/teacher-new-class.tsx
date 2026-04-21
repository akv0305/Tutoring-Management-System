import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface TeacherNewClassProps {
  teacherName: string
  studentName: string
  studentGrade: string
  subject: string
  scheduledSlots: string[]
  duration: number
  totalClasses: number
  isTrial: boolean
  dashboardUrl: string
}

export function TeacherNewClass({
  teacherName,
  studentName,
  studentGrade,
  subject,
  scheduledSlots,
  duration,
  totalClasses,
  isTrial,
  dashboardUrl,
}: TeacherNewClassProps) {
  return (
    <EmailLayout
      preview={
        isTrial
          ? `New trial class assigned — ${studentName} (${subject})`
          : `${totalClasses} new class${totalClasses > 1 ? "es" : ""} assigned — ${studentName} (${subject})`
      }
    >
      <Text style={emailStyles.heading}>
        {isTrial ? "New Trial Class Assigned" : "New Classes Assigned"}
      </Text>

      <Text style={emailStyles.paragraph}>
        Hi {teacherName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        {isTrial
          ? `A free trial class has been scheduled for you with a new student. Please review the details below:`
          : `${totalClasses} new class${totalClasses > 1 ? "es have" : " has"} been booked with you. Please review the details below:`}
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Student</Text>
        <Text style={emailStyles.value}>{studentName}</Text>

        <Text style={emailStyles.label}>Grade</Text>
        <Text style={emailStyles.value}>{studentGrade}</Text>

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
      </Section>

      {isTrial && (
        <Section style={emailStyles.infoBox}>
          <Text style={infoTitle}>Trial Class Tips</Text>
          <Text style={infoText}>
            This is the student&apos;s first session. Please introduce yourself,
            assess their current level, and make the experience welcoming. A great
            trial leads to long-term engagement.
          </Text>
        </Section>
      )}

      {!isTrial && (
        <Text style={emailStyles.mutedText}>
          These classes are pending payment confirmation. You will receive a
          notification once payment is verified and the classes are confirmed.
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button href={dashboardUrl} style={emailStyles.primaryButton}>
          View My Schedule
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

const infoTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}

const infoText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default TeacherNewClass
