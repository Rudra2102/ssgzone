const express = require('express');
const router = express.Router();
const ExportService = require('../../calendar-service/src/services/ExportService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Export tenant calendar and contacts data
router.post('/tenant/data', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { export_type = 'both' } = req.body;

    const exportData = await ExportService.exportTenantData(tenantId, export_type);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tenant-${tenantId}-export.json"`);
    
    res.json({
      success: true,
      tenant_id: tenantId,
      export_type,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Get export status
router.get('/tenant/status', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    res.json({
      success: true,
      tenant_id: tenantId,
      available_exports: ['calendar', 'contacts', 'both'],
      formats: ['ical', 'vcard']
    });
  } catch (error) {
    console.error('Export status error:', error);
    res.status(500).json({ error: 'Failed to get export status' });
  }
});

module.exports = router;