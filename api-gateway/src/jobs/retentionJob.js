const cron = require('node-cron');
const RetentionService = require('../services/RetentionService');

class RetentionJob {
  start() {
    // Run retention processing daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled retention processing...');
      try {
        await RetentionService.processRetention();
        console.log('Scheduled retention processing completed successfully');
      } catch (error) {
        console.error('Scheduled retention processing failed:', error);
      }
    });

    console.log('Retention job scheduler started');
  }
}

module.exports = new RetentionJob();