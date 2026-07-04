const db = require('./DatabaseService');
const xml2js = require('xml2js');

class DMARCService {
  async processDMARCReport(reportXML) {
    const parser = new xml2js.Parser();
    const report = await parser.parseStringPromise(reportXML);
    
    const metadata = report.feedback.report_metadata[0];
    const policyPublished = report.feedback.policy_published[0];
    const records = report.feedback.record || [];

    // Store report metadata
    const reportQuery = `
      INSERT INTO dmarc_reports (
        org_name, email, report_id, date_begin, date_end, 
        domain, policy_p, policy_sp, policy_pct, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    const reportResult = await db.query(reportQuery, [
      metadata.org_name[0],
      metadata.email[0],
      metadata.report_id[0],
      new Date(metadata.date_range[0].begin[0] * 1000),
      new Date(metadata.date_range[0].end[0] * 1000),
      policyPublished.domain[0],
      policyPublished.p[0],
      policyPublished.sp?.[0] || null,
      parseInt(policyPublished.pct?.[0] || '100')
    ]);

    const reportId = reportResult.rows[0].id;

    // Process individual records
    for (const record of records) {
      const row = record.row[0];
      const policyEvaluated = row.policy_evaluated[0];
      const identifiers = record.identifiers[0];
      const authResults = record.auth_results[0];

      await this.storeRecordData(reportId, {
        sourceIp: row.source_ip[0],
        count: parseInt(row.count[0]),
        disposition: policyEvaluated.disposition[0],
        dkim: policyEvaluated.dkim[0],
        spf: policyEvaluated.spf[0],
        headerFrom: identifiers.header_from[0],
        dkimResults: authResults.dkim || [],
        spfResults: authResults.spf || []
      });
    }

    return reportId;
  }

  async storeRecordData(reportId, data) {
    const query = `
      INSERT INTO dmarc_record_data (
        report_id, source_ip, count, disposition, dkim_result, spf_result,
        header_from, dkim_auth, spf_auth, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `;

    await db.query(query, [
      reportId,
      data.sourceIp,
      data.count,
      data.disposition,
      data.dkim,
      data.spf,
      data.headerFrom,
      JSON.stringify(data.dkimResults),
      JSON.stringify(data.spfResults)
    ]);
  }

  async getDMARCFailures(domain, hours = 24) {
    const query = `
      SELECT dr.domain, drd.source_ip, drd.count, drd.disposition,
             drd.dkim_result, drd.spf_result, drd.header_from, drd.created_at
      FROM dmarc_reports dr
      JOIN dmarc_record_data drd ON dr.id = drd.report_id
      WHERE dr.domain LIKE $1 
        AND drd.created_at >= NOW() - INTERVAL '${hours} hours'
        AND (drd.dkim_result = 'fail' OR drd.spf_result = 'fail' OR drd.disposition != 'none')
      ORDER BY drd.created_at DESC
    `;

    const result = await db.query(query, [`%${domain}%`]);
    return result.rows;
  }

  async getDMARCDashboardData() {
    const queries = {
      totalReports: 'SELECT COUNT(*) as count FROM dmarc_reports WHERE created_at >= NOW() - INTERVAL \'24 hours\'',
      failedEmails: `
        SELECT COUNT(*) as count FROM dmarc_record_data 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND (dkim_result = 'fail' OR spf_result = 'fail')
      `,
      topFailingDomains: `
        SELECT dr.domain, COUNT(*) as failures
        FROM dmarc_reports dr
        JOIN dmarc_record_data drd ON dr.id = drd.report_id
        WHERE drd.created_at >= NOW() - INTERVAL '24 hours'
        AND (drd.dkim_result = 'fail' OR drd.spf_result = 'fail')
        GROUP BY dr.domain
        ORDER BY failures DESC
        LIMIT 10
      `
    };

    const results = await Promise.all([
      db.query(queries.totalReports),
      db.query(queries.failedEmails),
      db.query(queries.topFailingDomains)
    ]);

    return {
      totalReports: results[0].rows[0].count,
      failedEmails: results[1].rows[0].count,
      topFailingDomains: results[2].rows
    };
  }
}

module.exports = new DMARCService();