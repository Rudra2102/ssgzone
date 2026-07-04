const { Pool } = require('pg');

class ExportService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssghub_mail',
      user: process.env.DB_USER || 'ssghub',
      password: process.env.DB_PASSWORD
    });
  }

  async exportCalendar(tenantId) {
    const query = `
      SELECT ce.*, c.display_name as calendar_name
      FROM calendar_events ce
      JOIN calendars c ON ce.calendar_id = c.id
      JOIN users u ON ce.user_id = u.id
      JOIN tenants t ON u.tenant_id = t.id
      WHERE t.id = $1
    `;
    
    const result = await this.pool.query(query, [tenantId]);
    
    let icalData = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SSGhub//Calendar//EN\r\n';
    
    for (const event of result.rows) {
      icalData += event.ical_data + '\r\n';
    }
    
    icalData += 'END:VCALENDAR\r\n';
    return icalData;
  }

  async exportContacts(tenantId) {
    const query = `
      SELECT c.*, ab.display_name as addressbook_name
      FROM contacts c
      JOIN address_books ab ON c.address_book_id = ab.id
      JOIN users u ON c.user_id = u.id
      JOIN tenants t ON u.tenant_id = t.id
      WHERE t.id = $1
    `;
    
    const result = await this.pool.query(query, [tenantId]);
    
    let vcardData = '';
    
    for (const contact of result.rows) {
      vcardData += contact.vcard_data + '\r\n';
    }
    
    return vcardData;
  }
}

module.exports = ExportService;