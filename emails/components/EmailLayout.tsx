// emails/components/EmailLayout.tsx
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Img,
    Text,
    Hr,
    Link,
    Font,
    Preview,
  } from "react-email"
  import * as React from "react"
  
  // ─── Brand tokens (matching tailwind.config.js) ───
  const colors = {
    primary: "#1E3A5F",
    secondary: "#0D9488",
    accent: "#F59E0B",
    background: "#F8FAFC",
    foreground: "#1E293B",
    muted: "#64748B",
    border: "#E2E8F0",
    white: "#FFFFFF",
  }
  
  type EmailLayoutProps = {
    preview: string
    children: React.ReactNode
  }
  
  export function EmailLayout({ preview, children }: EmailLayoutProps) {
    return (
      <Html lang="en">
        <Head>
          <Font
            fontFamily="Inter"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />
        </Head>
        <Preview>{preview}</Preview>
        <Body style={body}>
          <Container style={container}>
            {/* ── Header ── */}
            <Section style={header}>
              <Img
                src="https://expertguru.net/eglogo.png"
                width="120"
                height="auto"
                alt="Expert Guru"
                style={logo}
              />
            </Section>
  
            {/* ── Content ── */}
            <Section style={content}>
              {children}
            </Section>
  
            {/* ── Footer ── */}
            <Section style={footer}>
              <Hr style={divider} />
              <Text style={footerText}>
                Expert Guru — A Brand from DG Tutor
              </Text>
              <Text style={footerAddress}>
                #302, 3rd Floor, Meridian Plaza, Ameerpet,
                Hyderabad - 500016, Telangana, India
              </Text>
              <Text style={footerLinks}>
                <Link href="https://expertguru.net" style={footerLink}>
                  Website
                </Link>
                {" · "}
                <Link href="mailto:info@expertguru.net" style={footerLink}>
                  Contact Support
                </Link>
                {" · "}
                <Link href="https://expertguru.net/privacy-policy" style={footerLink}>
                  Privacy Policy
                </Link>
              </Text>
              <Text style={footerMuted}>
                You received this email because you have an account with Expert Guru.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    )
  }
  
  // ─── Reusable style pieces for templates to import ───
  
  export const emailStyles = {
    heading: {
      fontSize: "22px",
      fontWeight: "700",
      color: colors.foreground,
      lineHeight: "30px",
      margin: "0 0 16px 0",
    } as React.CSSProperties,
  
    paragraph: {
      fontSize: "15px",
      lineHeight: "24px",
      color: colors.foreground,
      margin: "0 0 16px 0",
    } as React.CSSProperties,
  
    mutedText: {
      fontSize: "13px",
      lineHeight: "20px",
      color: colors.muted,
      margin: "0 0 12px 0",
    } as React.CSSProperties,
  
    primaryButton: {
      backgroundColor: colors.secondary,
      color: colors.white,
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
      textAlign: "center" as const,
      borderRadius: "10px",
      padding: "12px 24px",
      display: "inline-block",
    } as React.CSSProperties,
  
    secondaryButton: {
      backgroundColor: colors.white,
      color: colors.primary,
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
      textAlign: "center" as const,
      borderRadius: "10px",
      padding: "12px 24px",
      display: "inline-block",
      border: `2px solid ${colors.border}`,
    } as React.CSSProperties,
  
    infoBox: {
      backgroundColor: "#F0FDFA",
      border: `1px solid #CCFBF1`,
      borderRadius: "10px",
      padding: "16px 20px",
      margin: "16px 0",
    } as React.CSSProperties,
  
    warningBox: {
      backgroundColor: "#FFFBEB",
      border: `1px solid #FEF3C7`,
      borderRadius: "10px",
      padding: "16px 20px",
      margin: "16px 0",
    } as React.CSSProperties,
  
    label: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      margin: "0 0 4px 0",
    } as React.CSSProperties,
  
    value: {
      fontSize: "15px",
      fontWeight: "600",
      color: colors.foreground,
      margin: "0 0 12px 0",
    } as React.CSSProperties,
  }
  
  // ─── Internal layout styles ───
  
  const body: React.CSSProperties = {
    backgroundColor: colors.background,
    fontFamily: "'Inter', Helvetica, Arial, sans-serif",
    margin: "0",
    padding: "0",
  }
  
  const container: React.CSSProperties = {
    maxWidth: "580px",
    margin: "0 auto",
    padding: "40px 20px",
  }
  
  const header: React.CSSProperties = {
    textAlign: "center",
    padding: "0 0 24px 0",
  }
  
  const logo: React.CSSProperties = {
    margin: "0 auto",
  }
  
  const content: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    padding: "32px",
  }
  
  const footer: React.CSSProperties = {
    padding: "24px 0 0 0",
    textAlign: "center",
  }
  
  const divider: React.CSSProperties = {
    borderColor: colors.border,
    margin: "0 0 20px 0",
  }
  
  const footerText: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: "600",
    color: colors.primary,
    margin: "0 0 4px 0",
  }
  
  const footerAddress: React.CSSProperties = {
    fontSize: "12px",
    lineHeight: "18px",
    color: colors.muted,
    margin: "0 0 12px 0",
  }
  
  const footerLinks: React.CSSProperties = {
    fontSize: "12px",
    color: colors.muted,
    margin: "0 0 12px 0",
  }
  
  const footerLink: React.CSSProperties = {
    color: colors.secondary,
    textDecoration: "none",
  }
  
  const footerMuted: React.CSSProperties = {
    fontSize: "11px",
    color: "#94A3B8",
    margin: "0",
  }
  