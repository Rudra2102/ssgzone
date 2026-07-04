const WebhookService = require('../../../api-gateway/src/services/WebhookService');
const SearchService = require('../../../api-gateway/src/services/SearchService');
const { shouldSendAutoResponse, markAutoResponseSent } = require('../../../api-gateway/src/routes/autoresponder');
const db = require('../../../api-gateway/src/services/DatabaseService');

class EnterpriseMailProcessor {
  async processIncomingEmail(email, tenantId) {
    try {
      // 1. Check for distribution groups
      await this.handleDistributionGroups(email, tenantId);
      
      // 2. Index email for search
      await SearchService.indexEmail(tenantId, email);
      
      // 3. Trigger webhook events
      await WebhookService.emailReceived(tenantId, email);
      
      // 4. Process auto-responders
      await this.processAutoResponders(email, tenantId);
      
      // 5. Check shared mailboxes
      await this.handleSharedMailboxes(email, tenantId);
      
    } catch (error) {
      console.error('Enterprise mail processing error:', error);
    }
  }

  async handleDistributionGroups(email, tenantId) {
    const groupQuery = `
      SELECT g.*, array_agg(u.email) as member_emails
      FROM email_groups g
      JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
      JOIN users u ON gm.user_id = u.id
      WHERE g.tenant_id = $1 AND g.email = $2 AND g.is_active = true
      GROUP BY g.id
    `;

    const result = await db.query(groupQuery, [tenantId, email.to]);
    
    if (result.rows.length > 0) {
      const group = result.rows[0];
      
      // Forward email to all group members
      for (const memberEmail of group.member_emails) {
        await this.forwardToMember(email, memberEmail, group.name);
      }
    }
  }

  async processAutoResponders(email, tenantId) {
    // Get recipient user
    const userQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND tenant_id = $2
    `;
    
    const userResult = await db.query(userQuery, [email.to, tenantId]);
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const autoResponse = await shouldSendAutoResponse(userId, email.from);
      
      if (autoResponse.shouldSend) {
        await this.sendAutoResponse(email, autoResponse);
        await markAutoResponseSent(userId, email.from);
      }
    }
  }

  async handleSharedMailboxes(email, tenantId) {
    const sharedQuery = `
      SELECT sm.*, array_agg(u.email) as user_emails
      FROM shared_mailboxes sm
      JOIN shared_mailbox_permissions smp ON sm.id = smp.mailbox_id
      JOIN users u ON smp.user_id = u.id
      WHERE sm.tenant_id = $1 AND sm.email = $2 AND sm.is_active = true
      GROUP BY sm.id
    `;

    const result = await db.query(sharedQuery, [tenantId, email.to]);
    
    if (result.rows.length > 0) {
      // Deliver to shared mailbox folder for all authorized users
      const mailbox = result.rows[0];
      await this.deliverToSharedMailbox(email, mailbox);
    }
  }

  async forwardToMember(email, memberEmail, groupName) {
    // Create forwarded email with group context
    const forwardedEmail = {
      ...email,
      to: memberEmail,
      headers: {
        ...email.headers,
        'X-SSGHub-Group': groupName,
        'X-Original-To': email.to
      }
    };
    
    // Process delivery (implementation depends on mail server architecture)
    console.log(`Forwarding email to group member: ${memberEmail}`);
  }

  async sendAutoResponse(originalEmail, autoResponse) {
    const responseEmail = {
      from: originalEmail.to,
      to: originalEmail.from,
      subject: autoResponse.subject,
      body: autoResponse.message,
      headers: {
        'X-Auto-Response': 'true',
        'In-Reply-To': originalEmail.messageId
      }
    };
    
    // Send auto-response (implementation depends on SMTP service)
    console.log(`Sending auto-response to: ${originalEmail.from}`);
  }

  async deliverToSharedMailbox(email, mailbox) {
    // Store email in shared mailbox folder
    console.log(`Delivering to shared mailbox: ${mailbox.name}`);
  }

  async processBounce(bounceData, tenantId) {
    // Log bounce
    const bounceQuery = `
      INSERT INTO email_bounces (email_id, recipient, bounce_type, reason, bounce_code, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await db.query(bounceQuery, [
      bounceData.emailId,
      bounceData.recipient,
      bounceData.bounceType,
      bounceData.reason,
      bounceData.bounceCode
    ]);

    // Trigger webhook
    await WebhookService.emailBounced(tenantId, bounceData);
  }

  async processSpamComplaint(complaintData, tenantId) {
    // Log complaint
    const complaintQuery = `
      INSERT INTO spam_complaints (email_id, complainant, complaint_type, feedback_loop_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await db.query(complaintQuery, [
      complaintData.emailId,
      complaintData.complainant,
      complaintData.type,
      complaintData.feedbackLoopId
    ]);

    // Trigger webhook
    await WebhookService.spamComplaint(tenantId, complaintData);
  }
}

module.exports = new EnterpriseMailProcessor();