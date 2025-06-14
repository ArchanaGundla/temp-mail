
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

// Fetch emails for specific address with precise filtering
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

        // Search for emails sent specifically TO the generated email address
        console.log(`🔍 Searching for emails TO: ${emailAddress}`);
        
        // Use more specific search criteria
        imap.search([
          'OR', 
          ['TO', emailAddress], 
          'OR',
          ['CC', emailAddress],
          ['BCC', emailAddress]
        ], (err, results) => {
          if (err) {
            console.error('❌ Search error:', err);
            // Try simpler search if complex search fails
            imap.search([['TO', emailAddress]], (err2, results2) => {
              if (err2) {
                console.error('❌ Simple search also failed:', err2);
                reject(err2);
                return;
              }
              processSearchResults(results2 || []);
            });
            return;
          }
          
          processSearchResults(results || []);
        });

        function processSearchResults(results) {
          console.log(`📊 Search results: ${results.length} emails found for ${emailAddress}`);
          console.log(`📋 Message IDs:`, results);

          if (!results || !results.length) {
            console.log(`ℹ️  No emails found for ${emailAddress}`);
            resolve([]);
            return;
          }

          // Process recent emails (limit to last 20 for performance)
          const recentResults = results.slice(-20);
          console.log(`📥 Processing ${recentResults.length} recent emails`);
          
          let processedCount = 0;

          const f = imap.fetch(recentResults, { 
            bodies: '',
            struct: true 
          });

          f.on('message', (msg, seqno) => {
            console.log(`📨 Processing message ${seqno}`);
            let buffer = '';
            let messageHeaders = {};
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.on('attributes', (attrs) => {
              messageHeaders = attrs;
            });

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (!err && parsed) {
                  // Double-check that this email is actually for our generated address
                  const toAddresses = parsed.to ? parsed.to.value : [];
                  const ccAddresses = parsed.cc ? parsed.cc.value : [];
                  const bccAddresses = parsed.bcc ? parsed.bcc.value : [];
                  
                  const allRecipients = [
                    ...toAddresses.map(addr => addr.address?.toLowerCase()),
                    ...ccAddresses.map(addr => addr.address?.toLowerCase()),
                    ...bccAddresses.map(addr => addr.address?.toLowerCase())
                  ].filter(Boolean);

                  const isForOurEmail = allRecipients.includes(emailAddress.toLowerCase());
                  
                  if (isForOurEmail) {
                    console.log(`✅ Confirmed email ${seqno} is for ${emailAddress}:`);
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
                  } else {
                    console.log(`❌ Email ${seqno} is not for ${emailAddress}, skipping`);
                    console.log(`   Recipients:`, allRecipients);
                  }
                } else if (err) {
                  console.error(`❌ Error parsing email ${seqno}:`, err);
                }
                
                processedCount++;
                console.log(`📊 Processed ${processedCount}/${recentResults.length} emails`);
                
                if (processedCount === recentResults.length) {
                  console.log(`🎉 Email processing complete. Found ${messages.length} emails for ${emailAddress}`);
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
        }
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
