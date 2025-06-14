
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
    keepalive: false
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
    keepalive: false
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
    keepalive: false
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
      console.log(`Trying IMAP config ${configIndex + 1}: ${config.host}:${config.port} (TLS: ${config.tls})`);
      
      const imap = new Imap(config);
      
      imap.once('ready', () => {
        console.log(`IMAP connection successful with config ${configIndex + 1}`);
        WORKING_CONFIG = config;
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        console.error(`IMAP config ${configIndex + 1} failed:`, err.message);
        configIndex++;
        setTimeout(tryNextConfig, 1000); // Wait 1 second before trying next config
      });

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

    const imap = new Imap(WORKING_CONFIG);
    const messages = [];

    imap.once('ready', () => {
      console.log(`Connected to IMAP, searching for emails to: ${emailAddress}`);
      
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('Error opening INBOX:', err);
          reject(err);
          return;
        }

        console.log(`INBOX opened, total messages: ${box.messages.total}`);

        // Search for emails sent to the specific address
        imap.search([['TO', emailAddress]], (err, results) => {
          if (err) {
            console.error('Search error:', err);
            reject(err);
            return;
          }

          console.log(`Found ${results ? results.length : 0} emails for ${emailAddress}`);

          if (!results || !results.length) {
            resolve([]);
            return;
          }

          // Get last 10 emails
          const recentResults = results.slice(-10);
          let processedCount = 0;

          const f = imap.fetch(recentResults, { bodies: '' });

          f.on('message', (msg, seqno) => {
            let buffer = '';
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (!err && parsed) {
                  console.log(`Parsed email ${seqno}: ${parsed.subject}`);
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
                  console.error(`Error parsing email ${seqno}:`, err);
                }
                
                processedCount++;
                if (processedCount === recentResults.length) {
                  imap.end();
                  resolve(messages.reverse()); // Most recent first
                }
              });
            });
          });

          f.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP Error:', err);
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
  
  console.log(`Fetching emails for: ${emailAddress}`);
  cleanupExpiredEmails();

  if (!tempEmails.has(emailAddress)) {
    console.log(`Email ${emailAddress} expired or does not exist`);
    return res.status(404).json({ error: 'Email expired or does not exist' });
  }

  try {
    const messages = await fetchEmailsForAddress(emailAddress);
    console.log(`Returning ${messages.length} messages for ${emailAddress}`);
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: `Failed to fetch emails: ${error.message}` });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Test IMAP connection on startup
testImapConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TempMail backend server running on http://localhost:${PORT}`);
      console.log(`IMAP Server: ${WORKING_CONFIG.host}:${WORKING_CONFIG.port} (TLS: ${WORKING_CONFIG.tls})`);
      console.log(`Domain: ${TEMP_EMAIL_DOMAIN}`);
      console.log('IMAP authentication successful!');
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to IMAP connection error:', err.message);
    console.log('Please check your IMAP credentials and server settings.');
    console.log('Available configurations tested:');
    IMAP_CONFIGS.forEach((config, index) => {
      console.log(`  Config ${index + 1}: ${config.host}:${config.port} (TLS: ${config.tls})`);
    });
    process.exit(1);
  });
