const { SMTPServer } = require('smtp-server');
const { IMAPServer } = require('./imap/imapServer');
const { SecurityManager } = require('./security/securityManager');
const { MessageProcessor } = require('./smtp/messageProcessor');
const FailoverManager = require('./services/FailoverManager');
const axios = require('axios');
require('dotenv').config();

class MailServer {
  constructor() {
    this.domain = process.env.DOMAIN || 'ssgzone.in';
    this.securityManager = new SecurityManager();
    this.messageProcessor = new MessageProcessor();
    this.imapServer = new IMAPServer();
    this.failoverManager = new FailoverManager();
    this.warmupServiceUrl = process.env.WARMUP_SERVICE_URL || 'http://ip-warmup-service:3004';
  }

  async start() {
    try {
      // Initialize failover manager
      await this.failoverManager.initialize();
      
      // Start SMTP Server
      await this.startSMTPServer();
      
      // Start IMAP Server
      await this.startIMAPServer();
      
      console.log('SSGzone Mail Server started successfully');
    } catch (error) {
      console.error('Failed to start mail server:', error);
      process.exit(1);
    }
  }

  async startSMTPServer() {
    const smtpServer = new SMTPServer({
      banner: `${this.domain} ESMTP SSGzone Mail Server`,
      
      // Authentication
      onAuth: async (auth, session, callback) => {
        try {
          const user = await this.authenticateUser(auth.username, auth.password);
          if (user) {
            session.user = user;
            callback(null, { user: user.email });
          } else {
            callback(new Error('Invalid credentials'));
          }
        } catch (error) {
          callback(error);
        }
      },

      // Message handling
      onData: async (stream, session, callback) => {
        try {
          // Check IP warmup limits before sending
          const canSend = await this.checkIPWarmupLimit(session.remoteAddress);
          if (!canSend) {
            callback(new Error('IP sending limit exceeded'));
            return;
          }
          
          await this.messageProcessor.processIncoming(stream, session);
          
          // Record email sent for IP warmup tracking
          await this.recordEmailSent(session.remoteAddress);
          
          callback();
        } catch (error) {
          callback(error);
        }
      },

      // Connection validation
      onConnect: async (session, callback) => {
        const isAllowed = await this.securityManager.validateConnection(session.remoteAddress);
        if (isAllowed) {
          callback();
        } else {
          callback(new Error('Connection rejected'));
        }
      },

      // Recipient validation
      onRcptTo: async (address, session, callback) => {
        const isValid = await this.validateRecipient(address.address);
        if (isValid) {
          callback();
        } else {
          callback(new Error('Recipient not found'));
        }
      },

      // Security options
      secure: false,
      authOptional: false,
      allowInsecureAuth: false,
      disabledCommands: ['STARTTLS'] // Enable in production with proper certs
    });

    smtpServer.listen(25, () => {
      console.log('SMTP Server listening on port 25');
    });

    // SMTP Submission (port 587)
    const submissionServer = new SMTPServer({
      banner: `${this.domain} ESMTP SSGzone Mail Submission`,
      secure: false,
      authOptional: false,
      onAuth: smtpServer.options.onAuth,
      onData: smtpServer.options.onData,
      onConnect: smtpServer.options.onConnect,
      onRcptTo: smtpServer.options.onRcptTo
    });

    submissionServer.listen(587, () => {
      console.log('SMTP Submission Server listening on port 587');
    });
  }

  async startIMAPServer() {
    await this.imapServer.start();
  }

  async authenticateUser(username, password) {
    const { Pool } = require('pg');
    const bcrypt = require('bcryptjs');
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssgzone_mail',
      user: process.env.DB_USER || 'ssgzone',
      password: process.env.DB_PASSWORD || 'academy'
    });

    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND status = $2';
      const result = await pool.query(query, [username, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (isValid) {
        // Update last login
        await pool.query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    } finally {
      await pool.end();
    }
  }

  async validateRecipient(email) {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssgzone_mail',
      user: process.env.DB_USER || 'ssgzone',
      password: process.env.DB_PASSWORD || 'academy'
    });

    try {
      const query = 'SELECT id FROM users WHERE email = $1 AND status = $2';
      const result = await pool.query(query, [email, 'active']);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Recipient validation error:', error);
      return false;
    } finally {
      await pool.end();
    }
  }

  async checkIPWarmupLimit(ipAddress) {
    try {
      const response = await axios.get(`${this.warmupServiceUrl}/warmup/check/${ipAddress}`);
      return response.data.data.canSend;
    } catch (error) {
      console.error('IP warmup check failed:', error);
      return true; // Allow sending if warmup service is unavailable
    }
  }

  async recordEmailSent(ipAddress) {
    try {
      await axios.post(`${this.warmupServiceUrl}/warmup/record/${ipAddress}`);
    } catch (error) {
      console.error('Failed to record email sent:', error);
    }
  }
}

// Start the server
const mailServer = new MailServer();
mailServer.start().catch(console.error);

module.exports = MailServer;