const cron = require('node-cron');
const db = require('../services/DatabaseService');
const MinIOService = require('../services/MinIOService');

class GDPRDeletionJob {
  constructor() {
    this.isRunning = false;
  }

  async processPendingDeletions() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Processing GDPR deletion queue...');

    try {
      // Get pending deletions that are scheduled
      const query = `
        SELECT id, user_id, user_email, tenant_id 
        FROM gdpr_deletion_queue 
        WHERE status = 'pending' AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT 10
      `;
      
      const result = await db.query(query);
      
      for (const deletion of result.rows) {
        await this.processUserDeletion(deletion);
      }
    } catch (error) {
      console.error('Error processing GDPR deletions:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processUserDeletion(deletion) {
    const { id: deletionId, user_id, user_email, tenant_id } = deletion;
    
    try {
      // Mark as processing
      await db.query(
        'UPDATE gdpr_deletion_queue SET status = $1, started_at = NOW() WHERE id = $2',
        ['processing', deletionId]
      );

      const auditSteps = [];

      // Step 1: Delete messages and attachments
      await this.auditStep(deletionId, 'delete_messages', async () => {
        const messages = await db.query('SELECT id FROM messages WHERE user_id = $1', [user_id]);
        
        // Delete attachments from MinIO
        for (const msg of messages.rows) {
          try {
            await MinIOService.deleteUserAttachments(user_id, msg.id);
          } catch (error) {
            console.warn(`Failed to delete attachments for message ${msg.id}:`, error);
          }
        }
        
        // Delete messages
        await db.query('DELETE FROM messages WHERE user_id = $1', [user_id]);
        return { deletedMessages: messages.rows.length };
      });

      // Step 2: Delete calendar items
      await this.auditStep(deletionId, 'delete_calendar', async () => {
        const result = await db.query('DELETE FROM calendar_events WHERE user_id = $1', [user_id]);
        return { deletedEvents: result.rowCount };
      });

      // Step 3: Delete auto-responders
      await this.auditStep(deletionId, 'delete_autoresponders', async () => {
        const result = await db.query('DELETE FROM auto_responders WHERE user_id = $1', [user_id]);
        return { deletedAutoResponders: result.rowCount };
      });

      // Step 4: Delete user from groups
      await this.auditStep(deletionId, 'remove_from_groups', async () => {
        const result = await db.query('DELETE FROM email_group_members WHERE user_id = $1', [user_id]);
        return { removedFromGroups: result.rowCount };
      });

      // Step 5: Delete audit logs (except this deletion process)
      await this.auditStep(deletionId, 'delete_audit_logs', async () => {
        const result = await db.query(
          'DELETE FROM audit_logs WHERE user_id = $1 AND action != $2', 
          [user_id, 'gdpr_deletion_request']
        );
        return { deletedAuditLogs: result.rowCount };
      });

      // Step 6: Delete user account
      await this.auditStep(deletionId, 'delete_user_account', async () => {
        await db.query('DELETE FROM users WHERE id = $1', [user_id]);
        return { userDeleted: true };
      });

      // Mark as completed
      await db.query(
        'UPDATE gdpr_deletion_queue SET status = $1, completed_at = NOW() WHERE id = $2',
        ['completed', deletionId]
      );

      console.log(`GDPR deletion completed for user: ${user_email}`);

    } catch (error) {
      console.error(`GDPR deletion failed for user ${user_email}:`, error);
      
      await db.query(
        'UPDATE gdpr_deletion_queue SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, deletionId]
      );
    }
  }

  async auditStep(deletionId, step, operation) {
    try {
      const result = await operation();
      
      await db.query(
        'INSERT INTO gdpr_deletion_audit (deletion_id, step, status, details) VALUES ($1, $2, $3, $4)',
        [deletionId, step, 'completed', JSON.stringify(result)]
      );
      
      return result;
    } catch (error) {
      await db.query(
        'INSERT INTO gdpr_deletion_audit (deletion_id, step, status, details) VALUES ($1, $2, $3, $4)',
        [deletionId, step, 'failed', JSON.stringify({ error: error.message })]
      );
      throw error;
    }
  }

  start() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.processPendingDeletions();
    });
    
    console.log('GDPR Deletion Job started - runs every 30 minutes');
  }
}

module.exports = new GDPRDeletionJob();