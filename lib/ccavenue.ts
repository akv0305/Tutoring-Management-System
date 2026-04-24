import crypto from "crypto"

const CCAVENUE_WORKING_KEY = process.env.CCAVENUE_WORKING_KEY || ""
const CCAVENUE_MERCHANT_ID = process.env.CCAVENUE_MERCHANT_ID || ""
const CCAVENUE_ACCESS_CODE = process.env.CCAVENUE_ACCESS_CODE || ""

const CCAVENUE_TEST_URL =
  "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
const CCAVENUE_PROD_URL =
  "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"

function getAlgorithm(keyBase64: string): string {
  const key = Buffer.from(keyBase64, "base64")
  switch (key.length) {
    case 16:
      return "aes-128-cbc"
    case 32:
      return "aes-256-cbc"
    default:
      throw new Error("Invalid key length: " + key.length)
  }
}

function getKeyAndIv() {
  const md5 = crypto.createHash("md5").update(CCAVENUE_WORKING_KEY).digest()
  const keyBase64 = Buffer.from(md5).toString("base64")
  const ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64")

  return { keyBase64, ivBase64 }
}

export function encrypt(plainText: string): string {
  const { keyBase64, ivBase64 } = getKeyAndIv()
  const key = Buffer.from(keyBase64, "base64")
  const iv = Buffer.from(ivBase64, "base64")

  const cipher = crypto.createCipheriv(getAlgorithm(keyBase64), key, iv)
  let encrypted = cipher.update(plainText, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

export function decrypt(encryptedText: string): string {
  const { keyBase64, ivBase64 } = getKeyAndIv()
  const key = Buffer.from(keyBase64, "base64")
  const iv = Buffer.from(ivBase64, "base64")

  const decipher = crypto.createDecipheriv(getAlgorithm(keyBase64), key, iv)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function buildPaymentUrl(encRequest: string): string {
  const mode = process.env.CCAVENUE_MODE || "test"
  const baseUrl = mode === "production" ? CCAVENUE_PROD_URL : CCAVENUE_TEST_URL
  return `${baseUrl}&merchant_id=${CCAVENUE_MERCHANT_ID}&encRequest=${encRequest}&access_code=${CCAVENUE_ACCESS_CODE}`
}

export function buildOrderString(params: Record<string, string>): string {
  // CCAvenue expects key=value pairs joined by &
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

export { CCAVENUE_MERCHANT_ID, CCAVENUE_ACCESS_CODE }
