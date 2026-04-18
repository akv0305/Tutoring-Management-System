// emails/verify-email.tsx
import { Text, Button, Section } from "react-email"
import * as React from "react"
import { EmailLayout, emailStyles } from "./components/EmailLayout"

type VerifyEmailProps = {
  parentName: string
  verifyUrl: string
}

export function VerifyEmail({ parentName, verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email to activate your Expert Guru account">
      <Text style={emailStyles.heading}>Verify Your Email Address</Text>

      <Text style={emailStyles.paragraph}>
        Hi {parentName},
      </Text>

      <Text style={emailStyles.paragraph}>
        Thank you for creating an account with Expert Guru! To get started,
        please verify your email address by clicking the button below.
      </Text>

      <Section style={buttonContainer}>
        <Button href={verifyUrl} style={emailStyles.primaryButton}>
          Verify My Email
        </Button>
      </Section>

      <Text style={emailStyles.mutedText}>
        This link will expire in 24 hours. If you did not create an account
        with Expert Guru, you can safely ignore this email.
      </Text>

      <Section style={emailStyles.infoBox}>
        <Text style={infoTitle}>What happens next?</Text>
        <Text style={infoItem}>1. Your email gets verified</Text>
        <Text style={infoItem}>2. A coordinator reviews your child's needs</Text>
        <Text style={infoItem}>3. You receive tutor matches within 24 hours</Text>
        <Text style={infoItem}>4. Schedule your first free trial class</Text>
      </Section>

      <Text style={emailStyles.mutedText}>
        If the button above doesn't work, copy and paste this link into your browser:
      </Text>
      <Text style={linkFallback}>
        {verifyUrl}
      </Text>
    </EmailLayout>
  )
}

export default VerifyEmail

// ─── Styles ───

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
}

const infoTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#0D9488",
  margin: "0 0 8px 0",
}

const infoItem: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "22px",
  color: "#1E293B",
  margin: "0",
}

const linkFallback: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#0D9488",
  wordBreak: "break-all",
  margin: "0 0 16px 0",
}
