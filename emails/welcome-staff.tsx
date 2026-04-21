import { Section, Text, Button, Hr } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface WelcomeStaffProps {
  name: string
  role: "TEACHER" | "COORDINATOR"
  email: string
  loginUrl: string
}

const roleConfig = {
  TEACHER: {
    title: "Welcome to Expert Guru — Teacher",
    preview: "Your teacher account has been created",
    roleLabel: "Teacher",
    description:
      "Your teacher account has been created by the admin team. You can now log in to access your dashboard, view assigned classes, manage your availability, and connect with students.",
    dashboardPath: "/teacher",
  },
  COORDINATOR: {
    title: "Welcome to Expert Guru — Coordinator",
    preview: "Your coordinator account has been created",
    roleLabel: "Coordinator",
    description:
      "Your coordinator account has been created by the admin team. You can now log in to access your dashboard, manage student onboarding, oversee class scheduling, and support parents.",
    dashboardPath: "/coordinator",
  },
}

export function WelcomeStaff({
  name,
  role,
  email,
  loginUrl,
}: WelcomeStaffProps) {
  const config = roleConfig[role]

  return (
    <EmailLayout preview={config.preview}>
      <Text style={emailStyles.heading}>{config.title}</Text>

      <Text style={emailStyles.paragraph}>Hi {name || "there"},</Text>

      <Text style={emailStyles.paragraph}>{config.description}</Text>

      <Section style={emailStyles.infoBox}>
        <Text style={emailStyles.label}>Role</Text>
        <Text style={emailStyles.value}>{config.roleLabel}</Text>

        <Text style={emailStyles.label}>Email (Login ID)</Text>
        <Text style={emailStyles.value}>{email}</Text>
      </Section>

      <Section style={emailStyles.warningBox}>
        <Text style={passwordTitle}>Setting Your Password</Text>
        <Text style={passwordText}>
          For security, your password is not included in this email. Please
          contact your admin for your initial password, or use the "Forgot
          Password" link on the login page to set your own password.
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
          {role === "TEACHER"
            ? "Once logged in, set up your availability, review your subject assignments, and check for any upcoming trial classes. Students and parents will be able to see your profile and book sessions."
            : "Once logged in, review your assigned students, check for any new registrations awaiting onboarding, and ensure trial classes are being scheduled promptly."}
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

export default WelcomeStaff
