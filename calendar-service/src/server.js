const express = require('express');
const cors = require('cors');
const CalDAVService = require('./services/CalDAVService');
const CardDAVService = require('./services/CardDAVService');
const ExportService = require('./services/ExportService');
require('dotenv').config();

const app = express();
const PORT = process.env.CALENDAR_PORT || 4003;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/calendar' }));
app.use(express.text({ type: 'text/vcard' }));

const caldavService = new CalDAVService();
const carddavService = new CardDAVService();
const exportService = new ExportService();

// CalDAV endpoints
app.use('/.well-known/caldav', (req, res) => {
  res.redirect(301, '/caldav/');
});

app.all('/caldav/:userId/*', async (req, res) => {
  try {
    const result = await caldavService.handleRequest(req);
    res.status(result.status).set(result.headers).send(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CardDAV endpoints  
app.use('/.well-known/carddav', (req, res) => {
  res.redirect(301, '/carddav/');
});

app.all('/carddav/:userId/*', async (req, res) => {
  try {
    const result = await carddavService.handleRequest(req);
    res.status(result.status).set(result.headers).send(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export endpoints
app.get('/export/:tenantId/calendar', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const calendarData = await exportService.exportCalendar(tenantId);
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send(calendarData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/export/:tenantId/contacts', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const contactsData = await exportService.exportContacts(tenantId);
    
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');
    res.send(contactsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'calendar' });
});

app.listen(PORT, () => {
  console.log(`SSGzone Calendar Service running on port ${PORT}`);
});

module.exports = app;