
const express = require('express');
const { createTempEmail, isValidTempEmail, updateEmailMessages, getActiveTempEmails } = require('../utils/emailUtils');
const { fetchEmailsForAddress } = require('../utils/imapUtils');

const router = express.Router();

// Create temporary email
router.post('/create-temp-email', (req, res) => {
  try {
    const result = createTempEmail();
    console.log(`✅ Created temp email: ${result.email}`);
    res.json(result);
  } catch (error) {
    console.error('❌ Error creating temp email:', error);
    res.status(500).json({ error: 'Failed to create temporary email' });
  }
});

// Get emails for specific address
router.get('/emails/:emailAddress', async (req, res) => {
  const { emailAddress } = req.params;
  
  console.log(`\n=== API Request: Fetching emails for ${emailAddress} ===`);
  console.log(`🕐 Request time: ${new Date().toISOString()}`);

  if (!isValidTempEmail(emailAddress)) {
    console.log(`❌ Email ${emailAddress} expired or does not exist`);
    console.log(`📋 Active temp emails:`, getActiveTempEmails());
    return res.status(404).json({ error: 'Email expired or does not exist' });
  }

  console.log(`✅ Email ${emailAddress} is valid and active`);

  try {
    console.log(`🔍 Starting email fetch process...`);
    const messages = await fetchEmailsForAddress(emailAddress);
    
    console.log(`📊 Fetch completed. Messages found: ${messages.length}`);
    
    // Update stored messages for this email
    updateEmailMessages(emailAddress, messages);
    
    console.log(`🎉 Successfully processed ${messages.length} messages for ${emailAddress}`);
    console.log(`📤 Sending response to client...`);
    
    res.json({ 
      messages,
      debug: {
        emailAddress,
        messageCount: messages.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error in API endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: `Failed to fetch emails: ${error.message}`,
      debug: {
        emailAddress,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
