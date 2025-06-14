
const express = require('express');
const cors = require('cors');
const { testImapConnection, getWorkingConfig } = require('./utils/imapUtils');
const { TEMP_EMAIL_DOMAIN, TEMP_EMAIL_LIFETIME } = require('./utils/emailUtils');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Use email routes
app.use('/api', emailRoutes);

// Test IMAP connection on startup
console.log(`\n🚀 Starting TempMail Backend Server...`);
console.log(`📧 Domain: ${TEMP_EMAIL_DOMAIN}`);
console.log(`⏰ Email lifetime: ${TEMP_EMAIL_LIFETIME / 60000} minutes`);

testImapConnection()
  .then(() => {
    const workingConfig = getWorkingConfig();
    app.listen(PORT, () => {
      console.log(`\n🎉 TempMail backend server running successfully!`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📧 IMAP Server: ${workingConfig.host}:${workingConfig.port} (TLS: ${workingConfig.tls})`);
      console.log(`📧 Domain: ${TEMP_EMAIL_DOMAIN}`);
      console.log(`✅ IMAP authentication successful!`);
      console.log(`\n📝 Ready to receive requests...`);
    });
  })
  .catch((err) => {
    console.error(`\n💥 Failed to start server due to IMAP connection error:`);
    console.error(`❌ ${err.message}`);
    console.log(`\n🔧 Troubleshooting steps:`);
    console.log(`1. Verify your email password is correct`);
    console.log(`2. Check if your email provider allows IMAP connections`);
    console.log(`3. Try enabling "Less secure app access" or use app-specific password`);
    console.log(`4. Verify the IMAP server settings with your email provider`);
    process.exit(1);
  });
