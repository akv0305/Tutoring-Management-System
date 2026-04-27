import crypto from "crypto"

const CCAVENUE_WORKING_KEY = process.env.CCAVENUE_WORKING_KEY || ""
const CCAVENUE_MERCHANT_ID = process.env.CCAVENUE_MERCHANT_ID || ""
const CCAVENUE_ACCESS_CODE = process.env.CCAVENUE_ACCESS_CODE || ""

export function encrypt(plainText: string): string {
  const m = crypto.createHash("md5")
  m.update(CCAVENUE_WORKING_KEY)
  const key = m.digest() // raw 16-byte Buffer — matches official kit exactly
  const iv = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
  ])
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv)
  let encrypted = cipher.update(plainText, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

export function decrypt(encryptedText: string): string {
  const m = crypto.createHash("md5")
  m.update(CCAVENUE_WORKING_KEY)
  const key = m.digest()
  const iv = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
  ])
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function buildOrderString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
}

export function parseResponseString(responseString: string): Record<string, string> {
  const params: Record<string, string> = {}
  responseString.split("&").forEach((pair) => {
    const [key, ...valueParts] = pair.split("=")
    if (key) {
      params[key.trim()] = valueParts.join("=").trim()
    }
  })
  return params
}

// buildPaymentUrl is no longer needed — DELETE it
// The redirect route now uses form POST instead

export { CCAVENUE_MERCHANT_ID, CCAVENUE_ACCESS_CODE }
