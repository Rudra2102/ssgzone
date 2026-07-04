const net = require('net');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

class IMAPServer {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssghub_mail',
      user: process.env.DB_USER || 'ssghub',
      password: process.env.DB_PASSWORD
    });
  }

  async start() {
    const server = net.createServer((socket) => {
      this.handleConnection(socket);
    });

    server.listen(993, () => {
      console.log('IMAP Server listening on port 993');
    });

    // Also listen on port 143 for non-SSL
    const plainServer = net.createServer((socket) => {
      this.handleConnection(socket);
    });

    plainServer.listen(143, () => {
      console.log('IMAP Server (plain) listening on port 143');
    });
  }

  handleConnection(socket) {
    const session = {
      socket: socket,
      authenticated: false,
      user: null,
      selectedFolder: null,
      tag: null
    };

    // Send greeting
    socket.write('* OK SSGhub IMAP Server ready\\r\\n');

    socket.on('data', (data) => {
      this.processCommand(session, data.toString());
    });

    socket.on('error', (error) => {
      console.error('IMAP connection error:', error);
    });

    socket.on('close', () => {
      console.log('IMAP connection closed');
    });
  }

  async processCommand(session, data) {
    const lines = data.trim().split('\\r\\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(' ');
      const tag = parts[0];
      const command = parts[1]?.toUpperCase();
      const args = parts.slice(2);

      session.tag = tag;

      try {
        switch (command) {
          case 'LOGIN':
            await this.handleLogin(session, args);
            break;
          case 'LIST':
            await this.handleList(session, args);
            break;
          case 'SELECT':
            await this.handleSelect(session, args);
            break;
          case 'FETCH':
            await this.handleFetch(session, args);
            break;
          case 'SEARCH':
            await this.handleSearch(session, args);
            break;
          case 'STORE':
            await this.handleStore(session, args);
            break;
          case 'LOGOUT':
            await this.handleLogout(session);
            break;
          case 'CAPABILITY':
            await this.handleCapability(session);
            break;
          default:
            session.socket.write(`${tag} BAD Unknown command\\r\\n`);
        }
      } catch (error) {
        console.error('IMAP command error:', error);
        session.socket.write(`${tag} NO Command failed\\r\\n`);
      }
    }
  }

  async handleLogin(session, args) {
    if (args.length < 2) {
      session.socket.write(`${session.tag} BAD LOGIN requires username and password\\r\\n`);
      return;
    }

    const username = args[0].replace(/"/g, '');
    const password = args[1].replace(/"/g, '');

    const user = await this.authenticateUser(username, password);
    if (user) {
      session.authenticated = true;
      session.user = user;
      session.socket.write(`${session.tag} OK LOGIN completed\\r\\n`);
    } else {
      session.socket.write(`${session.tag} NO LOGIN failed\\r\\n`);
    }
  }

  async handleList(session, args) {
    if (!session.authenticated) {
      session.socket.write(`${session.tag} NO Not authenticated\\r\\n`);
      return;
    }

    // Return standard folders
    const folders = ['INBOX', 'Sent', 'Drafts', 'Trash'];
    
    for (const folder of folders) {
      session.socket.write(`* LIST () "/" "${folder}"\\r\\n`);
    }
    
    session.socket.write(`${session.tag} OK LIST completed\\r\\n`);
  }

  async handleSelect(session, args) {
    if (!session.authenticated) {
      session.socket.write(`${session.tag} NO Not authenticated\\r\\n`);
      return;
    }

    const folder = args[0]?.replace(/"/g, '') || 'INBOX';
    session.selectedFolder = folder;

    // Get message count
    const messageCount = await this.getMessageCount(session.user.id, folder);
    const recentCount = await this.getRecentCount(session.user.id, folder);

    session.socket.write(`* ${messageCount} EXISTS\\r\\n`);
    session.socket.write(`* ${recentCount} RECENT\\r\\n`);
    session.socket.write(`* OK [UIDVALIDITY 1] UIDs valid\\r\\n`);
    session.socket.write(`${session.tag} OK [READ-WRITE] SELECT completed\\r\\n`);
  }

  async handleFetch(session, args) {
    if (!session.authenticated || !session.selectedFolder) {
      session.socket.write(`${session.tag} NO Not authenticated or no folder selected\\r\\n`);
      return;
    }

    const sequence = args[0];
    const items = args.slice(1).join(' ');

    const messages = await this.getMessages(session.user.id, session.selectedFolder, sequence);

    for (const message of messages) {
      let response = `* ${message.sequence} FETCH (`;
      
      if (items.includes('UID')) {
        response += `UID ${message.id} `;
      }
      
      if (items.includes('FLAGS')) {
        response += `FLAGS (${message.flags.join(' ')}) `;
      }
      
      if (items.includes('ENVELOPE')) {
        response += `ENVELOPE ("${message.subject}" "${message.sender}" "${message.recipients[0]}" "${new Date(message.received_at).toISOString()}") `;
      }
      
      if (items.includes('BODY') || items.includes('RFC822')) {
        const body = this.formatMessageBody(message);
        response += `BODY[] {${body.length}}\\r\\n${body}`;
      }
      
      response += ')\\r\\n';
      session.socket.write(response);
    }

    session.socket.write(`${session.tag} OK FETCH completed\\r\\n`);
  }

  async handleSearch(session, args) {
    if (!session.authenticated || !session.selectedFolder) {
      session.socket.write(`${session.tag} NO Not authenticated or no folder selected\\r\\n`);
      return;
    }

    // Simple search implementation
    const messages = await this.searchMessages(session.user.id, session.selectedFolder, args);
    const messageIds = messages.map(m => m.id).join(' ');
    
    session.socket.write(`* SEARCH ${messageIds}\\r\\n`);
    session.socket.write(`${session.tag} OK SEARCH completed\\r\\n`);
  }

  async handleStore(session, args) {
    if (!session.authenticated || !session.selectedFolder) {
      session.socket.write(`${session.tag} NO Not authenticated or no folder selected\\r\\n`);
      return;
    }

    // Handle flag updates
    session.socket.write(`${session.tag} OK STORE completed\\r\\n`);
  }

  async handleLogout(session) {
    session.socket.write('* BYE IMAP4rev1 Server logging out\\r\\n');
    session.socket.write(`${session.tag} OK LOGOUT completed\\r\\n`);
    session.socket.end();
  }

  async handleCapability(session) {
    session.socket.write('* CAPABILITY IMAP4rev1 LOGIN\\r\\n');
    session.socket.write(`${session.tag} OK CAPABILITY completed\\r\\n`);
  }

  async authenticateUser(username, password) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND status = $2';
      const result = await this.pool.query(query, [username, 'active']);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      return isValid ? user : null;
    } catch (error) {
      console.error('IMAP authentication error:', error);
      return null;
    }
  }

  async getMessageCount(userId, folder) {
    const query = 'SELECT COUNT(*) FROM messages WHERE user_id = $1 AND folder = $2';
    const result = await this.pool.query(query, [userId, folder]);
    return parseInt(result.rows[0].count);
  }

  async getRecentCount(userId, folder) {
    const query = `
      SELECT COUNT(*) FROM messages 
      WHERE user_id = $1 AND folder = $2 AND '\\\\Recent' = ANY(flags)
    `;
    const result = await this.pool.query(query, [userId, folder]);
    return parseInt(result.rows[0].count);
  }

  async getMessages(userId, folder, sequence) {
    let query = `
      SELECT *, ROW_NUMBER() OVER (ORDER BY received_at) as sequence
      FROM messages 
      WHERE user_id = $1 AND folder = $2
    `;
    
    if (sequence !== '*') {
      query += ` AND ROW_NUMBER() OVER (ORDER BY received_at) = $3`;
      const result = await this.pool.query(query, [userId, folder, parseInt(sequence)]);
      return result.rows;
    } else {
      const result = await this.pool.query(query, [userId, folder]);
      return result.rows;
    }
  }

  async searchMessages(userId, folder, criteria) {
    const query = `
      SELECT id FROM messages 
      WHERE user_id = $1 AND folder = $2
      ORDER BY received_at
    `;
    const result = await this.pool.query(query, [userId, folder]);
    return result.rows;
  }

  formatMessageBody(message) {
    let body = `Subject: ${message.subject}\\r\\n`;
    body += `From: ${message.sender}\\r\\n`;
    body += `To: ${message.recipients.join(', ')}\\r\\n`;
    body += `Date: ${new Date(message.received_at).toUTCString()}\\r\\n`;
    body += `\\r\\n`;
    body += message.body_text || message.body_html || '';
    return body;
  }
}

module.exports = { IMAPServer };