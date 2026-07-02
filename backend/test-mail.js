import { sendEmail } from './utils/mailer.js';

const testMail = async () => {
  console.log("Starting email test...");
  try {
    const success = await sendEmail(
      'irishandco75@gmail.com',
      'Test Email from ERP Portal',
      '<strong>Success!</strong> Your Nodemailer SMTP integration is working perfectly.'
    );
    if (success) {
      console.log("TEST SUCCESSFUL: Email sent!");
    } else {
      console.log("TEST FAILED: sendEmail returned false.");
    }
  } catch (error) {
    console.error("TEST ERROR: Exception thrown", error);
  }
};

testMail();
