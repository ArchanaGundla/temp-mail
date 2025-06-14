
const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = 3001;

// Configuration - Multiple attempts for different IMAP setups
const IMAP_CONFIGS = [
  // Config 1: Standard SSL/TLS
  {
    user: 'support@trueelement.in',
    password: 'trueelement@12',
    host: 'imap.trueelement.in',
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: 'imap.trueelement.in'
    },
    connTimeout: 60000,
    authTimeout: 30000,
    keepalive: false,
    debug: console.log
  },
  // Config 2: Try with STARTTLS
  {
    user: 'support@trueelement.in',
    password: 'trueelement@12',
    host: 'imap.trueelement.in',
    port: 143,
    tls: false,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: 'imap.trueelement.in'
    },
    connTimeout: 60000,
    authTimeout: 30000,
    keepalive: false,
    debug: console.log
  },
  // Config 3: Try different port
  {
    user: 'support@trueelement.in',
    password: 'trueelement@12',
    host: 'imap.trueelement.in',
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    },
    connTimeout: 60000,
    authTimeout: 30000,
    keepalive: false,
    debug: console.log
  }
];

let WORKING_CONFIG = null;

const TEMP_EMAIL_DOMAIN = 'trueelement.in';
const TEMP_EMAIL_LIFETIME = 600000; // 10 minutes in milliseconds

// In-memory store for emails and expiration timestamps
const tempEmails = new Map(); // { email_address: expiration_timestamp }

app.use(cors());
app.use(express.json());

// Generate random email address
function generateRandomEmail() {
  const prefix = Math.random().toString(36).substring(2, 10);
  return `${prefix}@${TEMP_EMAIL_DOMAIN}`;
}

// Cleanup expired emails
function cleanupExpiredEmails() {
  const now = Date.now();
  for (const [email, expiry] of tempEmails.entries()) {
    if (expiry < now) {
      tempEmails.delete(email);
    }
  }
}

// Test IMAP connection with multiple configurations
function testImapConnection() {
  return new Promise((resolve, reject) => {
    let configIndex = 0;
    
    function tryNextConfig() {
      if (configIndex >= IMAP_CONFIGS.length) {
        reject(new Error('All IMAP configurations failed'));
        return;
      }
      
      const config = IMAP_CONFIGS[configIndex];
      console.log(`\n=== Testing IMAP Config ${configIndex + 1} ===`);
      console.log(`Host: ${config.host}:${config.port}`);
      console.log(`TLS: ${config.tls}`);
      console.log(`User: ${config.user}`);
      
      const imap = new Imap(config);
      
      imap.once('ready', () => {
        console.log(`✅ IMAP connection successful with config ${configIndex + 1}`);
        WORKING_CONFIG = config;
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        console.error(`❌ IMAP config ${configIndex + 1} failed:`, err.message);
        console.error(`Error details:`, {
          code: err.code,
          errno: err.errno,
          syscall: err.syscall,
          address: err.address,
          port: err.port
        });
        configIndex++;
        setTimeout(tryNextConfig, 2000); // Wait 2 seconds before trying next config
      });

      console.log(`Attempting to connect...`);
      imap.connect();
    }
    
    tryNextConfig();
  });
}

// Fetch emails for specific address
function fetchEmailsForAddress(emailAddress) {
  return new Promise((resolve, reject) => {
    if (!WORKING_CONFIG) {
      reject(new Error('No working IMAP configuration available'));
      return;
    }

    console.log(`\n=== Fetching emails for: ${emailAddress} ===`);
    const imap = new Imap(WORKING_CONFIG);
    const messages = [];

    imap.once('ready', () => {
      console.log(`✅ Connected to IMAP successfully`);
      
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('❌ Error opening INBOX:', err);
          reject(err);
          return;
        }

        console.log(`📧 INBOX opened successfully`);
        console.log(`📊 Total messages in inbox: ${box.messages.total}`);
        console.log(`📊 New messages: ${box.messages.new}`);

        // Search for emails sent to the specific address
        console.log(`🔍 Searching for emails TO: ${emailAddress}`);
        imap.search([['TO', emailAddress]], (err, results) => {
          if (err) {
            console.error('❌ Search error:', err);
            reject(err);
            return;
          }

          console.log(`📊 Search results: ${results ? results.length : 0} emails found`);
          console.log(`📋 Message IDs:`, results);

          if (!results || !results.length) {
            console.log(`ℹ️  No emails found for ${emailAddress}`);
            resolve([]);
            return;
          }

          // If we have too many results, limit to last 10
          const recentResults = results.slice(-10);
          console.log(`📥 Processing ${recentResults.length} recent emails`);
          
          let processedCount = 0;

          const f = imap.fetch(recentResults, { bodies: '' });

          f.on('message', (msg, seqno) => {
            console.log(`📨 Processing message ${seqno}`);
            let buffer = '';
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (!err && parsed) {
                  console.log(`✅ Successfully parsed email ${seqno}:`);
                  console.log(`   From: ${parsed.from ? parsed.from.text : 'Unknown'}`);
                  console.log(`   Subject: ${parsed.subject || 'No Subject'}`);
                  console.log(`   Date: ${parsed.date}`);
                  
                  messages.push({
                    id: seqno.toString(),
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    subject: parsed.subject || 'No Subject',
                    preview: parsed.text ? parsed.text.substring(0, 100) + '...' : 'No preview available',
                    body: parsed.html || parsed.text || 'No body content',
                    timestamp: parsed.date || new Date(),
                    read: false
                  });
                } else if (err) {
                  console.error(`❌ Error parsing email ${seqno}:`, err);
                }
                
                processedCount++;
                console.log(`📊 Processed ${processedCount}/${recentResults.length} emails`);
                
                if (processedCount === recentResults.length) {
                  console.log(`🎉 All emails processed successfully`);
                  imap.end();
                  resolve(messages.reverse()); // Most recent first
                }
              });
            });
          });

          f.once('error', (err) => {
            console.error('❌ Fetch error:', err);
            reject(err);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
      console.error('Error details:', {
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        address: err.address,
        port: err.port
      });
      reject(err);
    });

    imap.connect();
  });
}

// API Routes
app.post('/api/create-temp-email', (req, res) => {
  cleanupExpiredEmails();

  const emailAddr = generateRandomEmail();
  const expirationTime = Date.now() + TEMP_EMAIL_LIFETIME;
  tempEmails.set(emailAddr, expirationTime);

  console.log(`Generated temporary email: ${emailAddr}`);

  // Auto-cleanup after expiration
  setTimeout(() => {
    tempEmails.delete(emailAddr);
  }, TEMP_EMAIL_LIFETIME);

  res.json({
    email: emailAddr,
    expiresIn: `${TEMP_EMAIL_LIFETIME / 60000} minutes`,
    expirationTime: new Date(expirationTime)
  });
});

app.get('/api/emails/:emailAddress', async (req, res) => {
  const { emailAddress } = req.params;
  
  console.log(`\n=== API Request: Fetching emails for ${emailAddress} ===`);
  cleanupExpiredEmails();

  if (!tempEmails.has(emailAddress)) {
    console.log(`❌ Email ${emailAddress} expired or does not exist`);
    console.log(`📋 Active temp emails:`, Array.from(tempEmails.keys()));
    return res.status(404).json({ error: 'Email expired or does not exist' });
  }

  console.log(`✅ Email ${emailAddress} is valid and active`);

  try {
    const messages = await fetchEmailsForAddress(emailAddress);
    console.log(`🎉 Successfully fetched ${messages.length} messages for ${emailAddress}`);
    res.json({ messages });
  } catch (error) {
    console.error('❌ Error in API endpoint:', error);
    res.status(500).json({ error: `Failed to fetch emails: ${error.message}` });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test IMAP connection on startup
console.log(`\n🚀 Starting TempMail Backend Server...`);
console.log(`📧 Domain: ${TEMP_EMAIL_DOMAIN}`);
console.log(`⏰ Email lifetime: ${TEMP_EMAIL_LIFETIME / 60000} minutes`);

testImapConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🎉 TempMail backend server running successfully!`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📧 IMAP Server: ${WORKING_CONFIG.host}:${WORKING_CONFIG.port} (TLS: ${WORKING_CONFIG.tls})`);
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
    console.log(`\n📋 Configurations tested:`);
    IMAP_CONFIGS.forEach((config, index) => {
      console.log(`  Config ${index + 1}: ${config.host}:${config.port} (TLS: ${config.tls})`);
    });
    process.exit(1);
  });
