const db = require('../utils/database');

class SearchService {
  /**
   * Index email for full-text search
   */
  async indexEmail(emailId, tenantId, subject, body, sender, recipients) {
    try {
      const result = await db.query(
        `INSERT INTO email_search_index (email_id, tenant_id, subject_text, body_text, sender_email, recipient_emails)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email_id) DO UPDATE SET
           subject_text = $3,
           body_text = $4,
           sender_email = $5,
           recipient_emails = $6,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [emailId, tenantId, subject, body, sender, recipients]
      );
      
      return { success: true, indexed_id: result.rows[0].id };
    } catch (error) {
      console.error('Error indexing email:', error);
      throw error;
    }
  }

  /**
   * Search emails by query
   */
  async searchEmails(tenantId, query, limit = 20, offset = 0) {
    try {
      if (!query || query.trim().length === 0) {
        return { success: true, results: [], total: 0 };
      }

      // Get search results
      const result = await db.query(
        `SELECT * FROM search_emails($1, $2, $3, $4)`,
        [tenantId, query, limit, offset]
      );

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM email_search_index esi
         WHERE esi.tenant_id = $1
         AND esi.search_vector @@ plainto_tsquery('english', $2)`,
        [tenantId, query]
      );

      return {
        success: true,
        results: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Advanced search with filters
   */
  async searchEmailsAdvanced(tenantId, query, filters = {}) {
    try {
      const {
        fromDate = null,
        toDate = null,
        sender = null,
        limit = 20,
        offset = 0
      } = filters;

      if (!query || query.trim().length === 0) {
        return { success: true, results: [], total: 0 };
      }

      // Get search results
      const result = await db.query(
        `SELECT * FROM search_emails_advanced($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, query, fromDate, toDate, sender, limit, offset]
      );

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM email_search_index esi
         WHERE esi.tenant_id = $1
         AND esi.search_vector @@ plainto_tsquery('english', $2)
         AND ($3::TIMESTAMP IS NULL OR esi.created_at >= $3)
         AND ($4::TIMESTAMP IS NULL OR esi.created_at <= $4)
         AND ($5::VARCHAR IS NULL OR esi.sender_email ILIKE $5)`,
        [tenantId, query, fromDate, toDate, sender]
      );

      return {
        success: true,
        results: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      throw error;
    }
  }

  /**
   * Remove email from search index
   */
  async removeFromIndex(emailId, tenantId) {
    try {
      const result = await db.query(
        `DELETE FROM email_search_index WHERE email_id = $1 AND tenant_id = $2`,
        [emailId, tenantId]
      );

      return { success: true, deleted: result.rowCount };
    } catch (error) {
      console.error('Error removing from index:', error);
      throw error;
    }
  }

  /**
   * Update indexed email
   */
  async updateIndex(emailId, tenantId, subject, body, sender, recipients) {
    try {
      const result = await db.query(
        `UPDATE email_search_index 
         SET subject_text = $3, body_text = $4, sender_email = $5, recipient_emails = $6
         WHERE email_id = $1 AND tenant_id = $2
         RETURNING id`,
        [emailId, tenantId, subject, body, sender, recipients]
      );

      if (result.rows.length === 0) {
        return { success: false, message: 'Email not found in index' };
      }

      return { success: true, updated_id: result.rows[0].id };
    } catch (error) {
      console.error('Error updating index:', error);
      throw error;
    }
  }

  /**
   * Get search statistics for tenant
   */
  async getSearchStats(tenantId) {
    try {
      const result = await db.query(
        `SELECT * FROM email_search_stats WHERE tenant_id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        return {
          success: true,
          stats: {
            indexed_emails: 0,
            unique_senders: 0,
            oldest_email: null,
            newest_email: null
          }
        };
      }

      return { success: true, stats: result.rows[0] };
    } catch (error) {
      console.error('Error getting search stats:', error);
      throw error;
    }
  }

  /**
   * Bulk index emails
   */
  async bulkIndexEmails(tenantId, emails) {
    try {
      const results = [];
      
      for (const email of emails) {
        const result = await this.indexEmail(
          email.id,
          tenantId,
          email.subject,
          email.body,
          email.sender,
          email.recipients
        );
        results.push(result);
      }

      return { success: true, indexed: results.length, results };
    } catch (error) {
      console.error('Error bulk indexing:', error);
      throw error;
    }
  }

  /**
   * Clear all indexes for tenant (use with caution)
   */
  async clearTenantIndex(tenantId) {
    try {
      const result = await db.query(
        `DELETE FROM email_search_index WHERE tenant_id = $1`,
        [tenantId]
      );

      return { success: true, deleted: result.rowCount };
    } catch (error) {
      console.error('Error clearing index:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
