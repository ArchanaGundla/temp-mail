
const express = require('express');
const cors = require('cors');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = 3001;

// Configuration - Updated to match your Python settings
const IMAP_CONFIG = {
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
};

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

// Test IMAP connection
function testImapConnection() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(IMAP_CONFIG);
    
    imap.once('ready', () => {
      console.log('IMAP connection successful');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      console.error('IMAP connection failed:', err.message);
      reject(err);
    });

    imap.connect();
  });
}

// Fetch emails for specific address
function fetchEmailsForAddress(emailAddress) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(IMAP_CONFIG);
    const messages = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for emails sent to the specific address
        imap.search([['TO', emailAddress]], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

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
                  messages.push({
                    id: seqno.toString(),
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    subject: parsed.subject || 'No Subject',
                    preview: parsed.text ? parsed.text.substring(0, 100) + '...' : 'No preview available',
                    body: parsed.html || parsed.text || 'No body content',
                    timestamp: parsed.date || new Date(),
                    read: false
                  });
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
  
  cleanupExpiredEmails();

  if (!tempEmails.has(emailAddress)) {
    return res.status(404).json({ error: 'Email expired or does not exist' });
  }

  try {
    const messages = await fetchEmailsForAddress(emailAddress);
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
      console.log(`IMAP Server: ${IMAP_CONFIG.host}:${IMAP_CONFIG.port}`);
      console.log(`Domain: ${TEMP_EMAIL_DOMAIN}`);
      console.log('IMAP authentication successful!');
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to IMAP connection error:', err.message);
    console.log('Please check your IMAP credentials and server settings.');
    process.exit(1);
  });
