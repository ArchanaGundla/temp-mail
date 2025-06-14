
const TEMP_EMAIL_DOMAIN = 'trueelement.in';
const TEMP_EMAIL_LIFETIME = 600000; // 10 minutes in milliseconds

// In-memory store for emails and their messages with expiration timestamps
const tempEmails = new Map(); // { email_address: { expiration: timestamp, messages: [] } }

// Generate random email address
function generateRandomEmail() {
  const prefix = Math.random().toString(36).substring(2, 10);
  return `${prefix}@${TEMP_EMAIL_DOMAIN}`;
}

// Cleanup expired emails and their messages
function cleanupExpiredEmails() {
  const now = Date.now();
  const expiredEmails = [];
  
  for (const [email, data] of tempEmails.entries()) {
    if (data.expiration < now) {
      expiredEmails.push(email);
      tempEmails.delete(email);
    }
  }
  
  if (expiredEmails.length > 0) {
    console.log(`🗑️  Cleaned up ${expiredEmails.length} expired emails:`, expiredEmails);
  }
}

// Create a new temporary email
function createTempEmail() {
  cleanupExpiredEmails();

  const emailAddr = generateRandomEmail();
  const expirationTime = Date.now() + TEMP_EMAIL_LIFETIME;
  
  // Store email with expiration and empty messages array
  tempEmails.set(emailAddr, {
    expiration: expirationTime,
    messages: []
  });

  console.log(`Generated temporary email: ${emailAddr}`);
  console.log(`Email will expire at: ${new Date(expirationTime)}`);

  // Auto-cleanup after expiration
  setTimeout(() => {
    if (tempEmails.has(emailAddr)) {
      console.log(`🗑️  Auto-cleanup: Removing expired email ${emailAddr}`);
      tempEmails.delete(emailAddr);
    }
  }, TEMP_EMAIL_LIFETIME);

  return {
    email: emailAddr,
    expiresIn: `${TEMP_EMAIL_LIFETIME / 60000} minutes`,
    expirationTime: new Date(expirationTime)
  };
}

// Check if email exists and is valid
function isValidTempEmail(emailAddress) {
  cleanupExpiredEmails();
  return tempEmails.has(emailAddress);
}

// Update messages for an email
function updateEmailMessages(emailAddress, messages) {
  const emailData = tempEmails.get(emailAddress);
  if (emailData) {
    emailData.messages = messages;
    tempEmails.set(emailAddress, emailData);
  }
}

// Get active temp emails for debugging
function getActiveTempEmails() {
  return Array.from(tempEmails.keys());
}

module.exports = {
  TEMP_EMAIL_DOMAIN,
  TEMP_EMAIL_LIFETIME,
  generateRandomEmail,
  cleanupExpiredEmails,
  createTempEmail,
  isValidTempEmail,
  updateEmailMessages,
  getActiveTempEmails
};
