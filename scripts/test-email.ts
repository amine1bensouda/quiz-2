/**
 * Test email delivery from VPS or locally.
 * Usage: npx tsx scripts/test-email.ts your@email.com
 */
import 'dotenv/config';
import { getEmailProviderLabel, isEmailConfigured, sendVerificationCodeEmail } from '../src/lib/email';

async function main() {
  const to = process.argv[2]?.trim();

  if (!to) {
    console.error('Usage: npx tsx scripts/test-email.ts your@email.com');
    process.exit(1);
  }

  if (!isEmailConfigured()) {
    console.error('❌ No email provider configured.');
    console.error('   Add RESEND_API_KEY (+ RESEND_FROM) or SMTP_* to .env');
    process.exit(1);
  }

  const provider = getEmailProviderLabel();
  console.log(`Provider: ${provider}`);
  console.log(`Sending test code to ${to}...`);

  try {
    await sendVerificationCodeEmail(to, 'Test User', '123456');
    console.log('✅ Email sent successfully.');
  } catch (error) {
    console.error('❌ Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
