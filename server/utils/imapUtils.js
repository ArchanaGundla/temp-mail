
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

        // Get all emails to search through
        console.log(`🔍 Fetching recent emails to search for ${emailAddress}`);
        
        const f = imap.fetch('1:*', { 
          bodies: '',
          struct: true 
        });

        let processedCount = 0;
        const totalToProcess = box.messages.total;

        f.on('message', (msg, seqno) => {
          console.log(`\n📨 Processing message ${seqno}`);
          let buffer = '';
          
          msg.on('body', (stream, info) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err && parsed) {
                // Enhanced debugging for email analysis
                console.log(`\n🔍 DETAILED ANALYSIS for message ${seqno}:`);
                console.log(`   From: ${parsed.from ? parsed.from.text : 'Unknown'}`);
                console.log(`   Subject: ${parsed.subject || 'No Subject'}`);
                console.log(`   Date: ${parsed.date || 'No Date'}`);
                
                // Get all possible recipient fields
                const toAddresses = parsed.to ? parsed.to.value || [] : [];
                const ccAddresses = parsed.cc ? parsed.cc.value || [] : [];
                const bccAddresses = parsed.bcc ? parsed.bcc.value || [] : [];
                
                // Get raw headers and convert to strings properly
                const rawToHeader = parsed.headers.get('to');
                const rawCcHeader = parsed.headers.get('cc');
                const rawBccHeader = parsed.headers.get('bcc');
                const deliveredToHeader = parsed.headers.get('delivered-to');
                const xOriginalToHeader = parsed.headers.get('x-original-to');
                
                // Convert headers to strings safely
                const rawTo = rawToHeader ? (typeof rawToHeader === 'string' ? rawToHeader : JSON.stringify(rawToHeader)) : '';
                const rawCc = rawCcHeader ? (typeof rawCcHeader === 'string' ? rawCcHeader : JSON.stringify(rawCcHeader)) : '';
                const rawBcc = rawBccHeader ? (typeof rawBccHeader === 'string' ? rawBccHeader : JSON.stringify(rawBccHeader)) : '';
                const deliveredTo = deliveredToHeader ? (typeof deliveredToHeader === 'string' ? deliveredToHeader : JSON.stringify(deliveredToHeader)) : '';
                const xOriginalTo = xOriginalToHeader ? (typeof xOriginalToHeader === 'string' ? xOriginalToHeader : JSON.stringify(xOriginalToHeader)) : '';
                
                console.log(`   📧 RECIPIENT ANALYSIS:`);
                console.log(`     Raw TO header: "${rawTo}"`);
                console.log(`     Raw CC header: "${rawCc}"`);
                console.log(`     Raw BCC header: "${rawBcc}"`);
                console.log(`     Delivered-To header: "${deliveredTo}"`);
                console.log(`     X-Original-To header: "${xOriginalTo}"`);
                
                // Extract all email addresses
                const allRecipients = [
                  ...toAddresses.map(addr => addr.address?.toLowerCase()),
                  ...ccAddresses.map(addr => addr.address?.toLowerCase()),
                  ...bccAddresses.map(addr => addr.address?.toLowerCase())
                ].filter(Boolean);
                
                console.log(`     Parsed recipients: [${allRecipients.join(', ')}]`);
                
                // Check for matches
                const targetEmail = emailAddress.toLowerCase();
                console.log(`     Target email: "${targetEmail}"`);
                
                // Multiple ways to check for matches
                const foundInParsed = allRecipients.includes(targetEmail);
                const foundInRawTo = rawTo.toLowerCase().includes(targetEmail);
                const foundInRawCc = rawCc.toLowerCase().includes(targetEmail);
                const foundInRawBcc = rawBcc.toLowerCase().includes(targetEmail);
                const foundInDeliveredTo = deliveredTo.toLowerCase().includes(targetEmail);
                const foundInXOriginalTo = xOriginalTo.toLowerCase().includes(targetEmail);
                
                console.log(`     🔍 MATCH CHECKS:`);
                console.log(`       - Parsed recipients: ${foundInParsed ? '✅' : '❌'}`);
                console.log(`       - Raw TO header: ${foundInRawTo ? '✅' : '❌'}`);
                console.log(`       - Raw CC header: ${foundInRawCc ? '✅' : '❌'}`);
                console.log(`       - Raw BCC header: ${foundInRawBcc ? '✅' : '❌'}`);
                console.log(`       - Delivered-To header: ${foundInDeliveredTo ? '✅' : '❌'}`);
                console.log(`       - X-Original-To header: ${foundInXOriginalTo ? '✅' : '❌'}`);
                
                const isForOurEmail = foundInParsed || foundInRawTo || foundInRawCc || 
                                     foundInRawBcc || foundInDeliveredTo || foundInXOriginalTo;
                
                console.log(`     📊 FINAL MATCH RESULT: ${isForOurEmail ? '✅ MATCH!' : '❌ NO MATCH'}`);
                
                if (isForOurEmail) {
                  console.log(`\n🎉 EMAIL ${seqno} IS FOR ${emailAddress} - ADDING TO RESULTS`);
                  
                  const emailMessage = {
                    id: seqno.toString(),
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    subject: parsed.subject || 'No Subject',
                    preview: parsed.text ? parsed.text.substring(0, 100) + '...' : 'No preview available',
                    body: parsed.html || parsed.text || 'No body content',
                    timestamp: parsed.date || new Date(),
                    read: false
                  };
                  
                  messages.push(emailMessage);
                  console.log(`   📝 Added message: ${emailMessage.subject}`);
                } else {
                  console.log(`\n⚠️  EMAIL ${seqno} NOT FOR ${emailAddress} - SKIPPING`);
                }
              } else if (err) {
                console.error(`❌ Error parsing email ${seqno}:`, err);
              }
              
              processedCount++;
              console.log(`\n📊 Progress: ${processedCount}/${totalToProcess} emails processed`);
              
              if (processedCount === totalToProcess) {
                console.log(`\n🎉 EMAIL PROCESSING COMPLETE!`);
                console.log(`📊 FINAL RESULTS:`);
                console.log(`   - Total emails in inbox: ${totalToProcess}`);
                console.log(`   - Emails found for ${emailAddress}: ${messages.length}`);
                
                if (messages.length > 0) {
                  console.log(`   📋 Found emails:`);
                  messages.forEach((msg, index) => {
                    console.log(`     ${index + 1}. From: ${msg.from}, Subject: "${msg.subject}"`);
                  });
                } else {
                  console.log(`\n⚠️  NO EMAILS FOUND FOR ${emailAddress}`);
                  console.log(`💡 Possible reasons:`);
                  console.log(`   - No emails have been sent to this address yet`);
                  console.log(`   - Emails are in a different folder (Spam/Junk)`);
                  console.log(`   - Email address mismatch in headers`);
                  console.log(`   - Email server forwarding configuration`);
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
          console.log('📥 Fetch operation completed');
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
