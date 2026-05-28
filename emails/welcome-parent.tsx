import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface WelcomeParentProps {
  name: string
  email: string
  loginUrl: string
}

export function WelcomeParent({ name, email, loginUrl }: WelcomeParentProps) {
  return (
    <EmailLayout preview="Your parent account has been created">
      <Text style={emailStyles.heading}>
        Welcome to Expert Guru — Parent
      </Text>

      <Text style={emailStyles.paragraph}>Hi {name || "there"},</Text>

      <Text style={emailStyles.paragraph}>
        Your parent account has been created by the Expert Guru team. You can
        now log in to access your dashboard, view your children&apos;s classes,
        book sessions with teachers, and manage payments.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Role</Text>
        <Text style={emailStyles.value}>Parent</Text>

        <Text style={emailStyles.label}>Email (Login ID)</Text>
        <Text style={emailStyles.value}>{email}</Text>
      </Section>

      <Section style={emailStyles.warningBox}>
        <Text style={passwordTitle}>Setting Your Password</Text>
        <Text style={passwordText}>
          For security, your password is not included in this email. Please
          contact your coordinator or admin for your initial password, or use
          the &quot;Forgot Password&quot; link on the login page to set your own
          password.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button href={loginUrl} style={emailStyles.primaryButton}>
          Go to Login
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={emailStyles.infoBox}>
        <Text style={tipsTitle}>Getting Started</Text>
        <Text style={tipsText}>
          Once logged in, you can browse available teachers, book trial or
          regular classes for your children, track upcoming sessions, and view
          payment history. Your coordinator is available to help with any
          questions.
        </Text>
      </Section>

      <Text style={emailStyles.mutedText}>
        If you have any questions, please contact the admin team at
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
  margin: "16px 0",
}
const passwordTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#92400E",
  margin: "0 0 4px 0",
}
const passwordText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400E",
  margin: "0",
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

export default WelcomeParent
