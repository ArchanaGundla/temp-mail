
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// IMAP Configuration - Multiple attempts for different IMAP setups
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
  }
];

let WORKING_CONFIG = null;

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
        configIndex++;
        setTimeout(tryNextConfig, 2000);
      });

      console.log(`Attempting to connect...`);
      imap.connect();
    }
    
    tryNextConfig();
  });
}

// Fetch emails for specific address with improved filtering
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

        if (box.messages.total === 0) {
          console.log(`ℹ️  No messages in inbox`);
          resolve([]);
          return;
        }

        // First, let's try to get all recent emails and then filter them
        console.log(`🔍 Fetching recent emails to search for ${emailAddress}`);
        
        // Get the last 50 emails to search through
        const totalMessages = box.messages.total;
        const startSeq = Math.max(1, totalMessages - 49); // Last 50 messages
        const endSeq = totalMessages;
        
        console.log(`📥 Fetching messages ${startSeq} to ${endSeq}`);
        
        const f = imap.fetch(`${startSeq}:${endSeq}`, { 
          bodies: '',
          struct: true 
        });

        let processedCount = 0;
        const totalToProcess = endSeq - startSeq + 1;

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
                // Check if this email is for our generated address
                const toAddresses = parsed.to ? parsed.to.value || [] : [];
                const ccAddresses = parsed.cc ? parsed.cc.value || [] : [];
                const bccAddresses = parsed.bcc ? parsed.bcc.value || [] : [];
                
                // Also check raw headers for more comprehensive matching
                const rawTo = parsed.headers.get('to') || '';
                const rawCc = parsed.headers.get('cc') || '';
                const rawBcc = parsed.headers.get('bcc') || '';
                
                const allRecipients = [
                  ...toAddresses.map(addr => addr.address?.toLowerCase()),
                  ...ccAddresses.map(addr => addr.address?.toLowerCase()),
                  ...bccAddresses.map(addr => addr.address?.toLowerCase())
                ].filter(Boolean);

                // Also check raw headers (case-insensitive)
                const targetEmail = emailAddress.toLowerCase();
                const foundInRaw = rawTo.toLowerCase().includes(targetEmail) || 
                                 rawCc.toLowerCase().includes(targetEmail) || 
                                 rawBcc.toLowerCase().includes(targetEmail);
                
                const isForOurEmail = allRecipients.includes(targetEmail) || foundInRaw;
                
                console.log(`📧 Message ${seqno} analysis:`);
                console.log(`   From: ${parsed.from ? parsed.from.text : 'Unknown'}`);
                console.log(`   Subject: ${parsed.subject || 'No Subject'}`);
                console.log(`   To: ${rawTo}`);
                console.log(`   Recipients found: ${allRecipients.join(', ')}`);
                console.log(`   Target email: ${targetEmail}`);
                console.log(`   Match: ${isForOurEmail ? '✅ YES' : '❌ NO'}`);
                
                if (isForOurEmail) {
                  console.log(`✅ Email ${seqno} is for ${emailAddress} - ADDING TO RESULTS`);
                  
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
              } else if (err) {
                console.error(`❌ Error parsing email ${seqno}:`, err);
              }
              
              processedCount++;
              console.log(`📊 Processed ${processedCount}/${totalToProcess} emails`);
              
              if (processedCount === totalToProcess) {
                console.log(`🎉 Email processing complete!`);
                console.log(`📊 Total emails found for ${emailAddress}: ${messages.length}`);
                
                if (messages.length > 0) {
                  console.log(`📋 Found emails:`);
                  messages.forEach((msg, index) => {
                    console.log(`   ${index + 1}. From: ${msg.from}, Subject: ${msg.subject}`);
                  });
                } else {
                  console.log(`⚠️  No emails found for ${emailAddress}`);
                  console.log(`💡 This could mean:`);
                  console.log(`   - No emails have been sent to this address yet`);
                  console.log(`   - Emails are in a different folder (check Spam/Junk)`);
                  console.log(`   - Email server configuration issue`);
                }
                
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

        f.once('end', () => {
          console.log('📥 Fetch completed');
        });
      });
    });

    imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err);
      reject(err);
    });

    imap.connect();
  });
}

module.exports = {
  testImapConnection,
  fetchEmailsForAddress,
  getWorkingConfig: () => WORKING_CONFIG
};
