const fs = require('fs');
const path = require('path');
const db = require('./DatabaseService');

class MigrationService {
  
  async processMigrationJob(jobId, filePath) {
    try {
      // Update job status
      await db.query(
        'UPDATE migration_jobs SET status = $1, started_at = NOW() WHERE id = $2',
        ['processing', jobId]
      );

      await this.logProgress(jobId, 'file_validation', 'processing', 'Validating uploaded file');

      // Get job details
      const jobQuery = 'SELECT * FROM migration_jobs WHERE id = $1';
      const jobResult = await db.query(jobQuery, [jobId]);
      const job = jobResult.rows[0];

      if (!job) {
        throw new Error('Job not found');
      }

      // Simulate file processing (in production, use actual MBOX/PST parsers)
      await this.simulateFileProcessing(jobId, job, filePath);

      // Mark as completed
      await db.query(
        'UPDATE migration_jobs SET status = $1, completed_at = NOW(), progress_percentage = 100 WHERE id = $2',
        ['completed', jobId]
      );

      await this.logProgress(jobId, 'completion', 'completed', 'Migration completed successfully');

      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

    } catch (error) {
      console.error(`Migration job ${jobId} failed:`, error);
      
      await db.query(
        'UPDATE migration_jobs SET status = $1, error_log = $2 WHERE id = $3',
        ['failed', error.message, jobId]
      );

      await this.logProgress(jobId, 'error', 'failed', error.message);

      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async simulateFileProcessing(jobId, job, filePath) {
    // Simulate message count detection
    const estimatedMessages = Math.floor(Math.random() * 1000) + 100;
    
    await db.query(
      'UPDATE migration_jobs SET total_messages = $1 WHERE id = $2',
      [estimatedMessages, jobId]
    );

    await this.logProgress(jobId, 'message_count', 'completed', `Found ${estimatedMessages} messages to import`);

    // Simulate processing messages in batches
    let processed = 0;
    let imported = 0;
    const batchSize = 50;

    while (processed < estimatedMessages) {
      const batchEnd = Math.min(processed + batchSize, estimatedMessages);
      const batchImported = Math.floor(Math.random() * batchSize) + Math.floor(batchSize * 0.8);
      
      processed = batchEnd;
      imported += batchImported;
      
      const progress = Math.floor((processed / estimatedMessages) * 100);
      
      await db.query(
        'UPDATE migration_jobs SET processed_messages = $1, imported_messages = $2, progress_percentage = $3 WHERE id = $4',
        [processed, imported, progress, jobId]
      );

      await this.logProgress(
        jobId, 
        'batch_processing', 
        'processing', 
        `Processed ${processed}/${estimatedMessages} messages (${imported} imported)`
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const failed = processed - imported;
    await db.query(
      'UPDATE migration_jobs SET failed_messages = $1 WHERE id = $2',
      [failed, jobId]
    );
  }

  async logProgress(jobId, step, status, message, details = null) {
    const query = `
      INSERT INTO migration_progress (job_id, step, status, message, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await db.query(query, [jobId, step, status, message, details ? JSON.stringify(details) : null]);
  }
}

module.exports = new MigrationService();