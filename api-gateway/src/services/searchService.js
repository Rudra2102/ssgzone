const { Client } = require('@elastic/elasticsearch');

class SearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
    this.indexPrefix = 'ssghub-emails';
  }

  getIndexName(tenantId) {
    return `${this.indexPrefix}-${tenantId}`;
  }

  async indexEmail(tenantId, email) {
    const index = this.getIndexName(tenantId);
    
    await this.client.index({
      index,
      id: email.id,
      body: {
        subject: email.subject,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        body: email.body,
        html_body: email.html_body,
        date: email.date,
        folder: email.folder,
        flags: email.flags,
        attachments: email.attachments?.map(att => ({
          filename: att.filename,
          content_type: att.content_type
        })) || [],
        tenant_id: tenantId,
        indexed_at: new Date()
      }
    });
  }

  async searchEmails(tenantId, query, options = {}) {
    const index = this.getIndexName(tenantId);
    const { from = 0, size = 20, folder, dateRange, hasAttachments } = options;

    const must = [];
    const filter = [{ term: { tenant_id: tenantId } }];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['subject^3', 'from^2', 'to^2', 'body', 'html_body'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    if (folder) {
      filter.push({ term: { folder } });
    }

    if (dateRange) {
      filter.push({
        range: {
          date: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        }
      });
    }

    if (hasAttachments) {
      filter.push({
        range: {
          'attachments.filename': { gt: 0 }
        }
      });
    }

    const searchBody = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      },
      sort: [{ date: { order: 'desc' } }],
      from,
      size,
      highlight: {
        fields: {
          subject: {},
          body: {},
          html_body: {}
        }
      }
    };

    const result = await this.client.search({
      index,
      body: searchBody
    });

    return {
      total: result.body.hits.total.value,
      emails: result.body.hits.hits.map(hit => ({
        ...hit._source,
        highlights: hit.highlight
      }))
    };
  }

  async deleteEmail(tenantId, emailId) {
    const index = this.getIndexName(tenantId);
    
    await this.client.delete({
      index,
      id: emailId
    });
  }

  async createTenantIndex(tenantId) {
    const index = this.getIndexName(tenantId);
    
    const mapping = {
      properties: {
        subject: { type: 'text', analyzer: 'standard' },
        from: { type: 'keyword' },
        to: { type: 'keyword' },
        cc: { type: 'keyword' },
        bcc: { type: 'keyword' },
        body: { type: 'text', analyzer: 'standard' },
        html_body: { type: 'text', analyzer: 'standard' },
        date: { type: 'date' },
        folder: { type: 'keyword' },
        flags: { type: 'keyword' },
        attachments: {
          type: 'nested',
          properties: {
            filename: { type: 'text' },
            content_type: { type: 'keyword' }
          }
        },
        tenant_id: { type: 'integer' },
        indexed_at: { type: 'date' }
      }
    };

    await this.client.indices.create({
      index,
      body: { mappings: mapping }
    });
  }

  async deleteTenantIndex(tenantId) {
    const index = this.getIndexName(tenantId);
    await this.client.indices.delete({ index });
  }
}

module.exports = new SearchService();