import { Section, Text, Button, Link } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

interface ResetPasswordProps {
  userName: string
  resetUrl: string
}

export function ResetPassword({ userName, resetUrl }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your Expert Guru password">
      <Text style={emailStyles.heading}>Reset Your Password</Text>

      <Text style={emailStyles.paragraph}>
        Hi {userName || "there"},
      </Text>

      <Text style={emailStyles.paragraph}>
        We received a request to reset the password for your Expert Guru account.
        Click the button below to set a new password.
      </Text>

      <Section style={buttonContainer}>
        <Button href={resetUrl} style={emailStyles.primaryButton}>
          Reset Password
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        This link will expire in 24 hours. If you didn&apos;t request a password
        reset, you can safely ignore this email — your password will remain unchanged.
      </Text>

      <Section style={emailStyles.warningBox}>
        <Text style={warningTitle}>Security Notice</Text>
        <Text style={warningText}>
          If you did not request this reset, someone may have entered your email
          address by mistake. No changes have been made to your account.
        </Text>
      </Section>

      <Text style={emailStyles.mutedText}>
        If the button above doesn&apos;t work, copy and paste this link into your browser:
      </Text>
      <Text style={fallbackLink}>{resetUrl}</Text>
    </EmailLayout>
  )
}

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
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

const fallbackLink: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#0D9488",
  wordBreak: "break-all",
  margin: "0 0 16px 0",
}

export default ResetPassword
