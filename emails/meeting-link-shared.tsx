import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface MeetingLinkSharedProps {
  parentName: string
  studentName: string
  teacherName: string
  subject: string
  scheduledAt: string
  duration: number
  meetingLink: string
  dashboardUrl: string
}

export function MeetingLinkShared({
  parentName,
  studentName,
  teacherName,
  subject,
  scheduledAt,
  duration,
  meetingLink,
  dashboardUrl,
}: MeetingLinkSharedProps) {
  return (
    <EmailLayout preview={`Meeting link ready for ${studentName}'s ${subject} class`}>
      <Text style={emailStyles.heading}>Meeting Link Ready</Text>

      <Text style={emailStyles.paragraph}>
        Hi {parentName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        The meeting link for {studentName}&apos;s upcoming {subject} class is now
        available. Your child can join the session using the link below.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Subject</Text>
        <Text style={emailStyles.value}>{subject}</Text>

        <Text style={emailStyles.label}>Teacher</Text>
        <Text style={emailStyles.value}>{teacherName}</Text>

        <Text style={emailStyles.label}>Scheduled At</Text>
        <Text style={emailStyles.value}>{scheduledAt}</Text>

        <Text style={emailStyles.label}>Duration</Text>
        <Text style={emailStyles.value}>{duration} minutes</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={meetingLink} style={joinButton}>
          Join Class
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        Or copy this link into your browser:
      </Text>
      <Text style={fallbackLink}>{meetingLink}</Text>

      <Hr style={divider} />

      <Section style={emailStyles.infoBox}>
        <Text style={tipsTitle}>Before the Class</Text>
        <Text style={tipsText}>
          Please ensure your child has a stable internet connection, a quiet
          environment, and any required study materials ready before the session
          begins. We recommend joining 2–3 minutes early.
        </Text>
      </Section>

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
  margin: "24px 0",
}

const joinButton: React.CSSProperties = {
  backgroundColor: "#1E3A5F",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  borderRadius: "10px",
  padding: "14px 32px",
  display: "inline-block",
}

const fallbackLink: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#0D9488",
  wordBreak: "break-all",
  margin: "0 0 16px 0",
}

const divider: React.CSSProperties = {
  borderColor: "#E2E8F0",
  margin: "16px 0",
}

const tipsTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 4px 0",
}

const tipsText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#0D9488",
  margin: "0",
}

export default MeetingLinkShared
