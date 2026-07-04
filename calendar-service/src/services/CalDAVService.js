const { Pool } = require('pg');

class CalDAVService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ssghub_mail',
      user: process.env.DB_USER || 'ssghub',
      password: process.env.DB_PASSWORD
    });
  }

  async handleRequest(req) {
    const { method, url, headers, body } = req;
    const userId = req.params.userId;

    switch (method) {
      case 'PROPFIND':
        return this.handlePropfind(userId, url, headers);
      case 'REPORT':
        return this.handleReport(userId, body);
      case 'PUT':
        return this.handlePut(userId, url, body);
      case 'DELETE':
        return this.handleDelete(userId, url);
      case 'GET':
        return this.handleGet(userId, url);
      default:
        return { status: 405, headers: {}, body: 'Method Not Allowed' };
    }
  }

  async handlePropfind(userId, url, headers) {
    const depth = headers.depth || '1';
    
    if (url.endsWith('/')) {
      // Calendar collection
      const calendars = await this.getCalendars(userId);
      const response = this.buildCalendarCollectionResponse(calendars);
      return {
        status: 207,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        body: response
      };
    } else {
      // Individual calendar
      const calendar = await this.getCalendar(userId, url);
      const response = this.buildCalendarResponse(calendar);
      return {
        status: 207,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        body: response
      };
    }
  }

  async handleReport(userId, body) {
    // Parse calendar-query or calendar-multiget
    const events = await this.getEvents(userId);
    const response = this.buildEventsResponse(events);
    return {
      status: 207,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      body: response
    };
  }

  async handlePut(userId, url, body) {
    const eventId = this.extractEventId(url);
    await this.saveEvent(userId, eventId, body);
    return { status: 201, headers: {}, body: '' };
  }

  async handleDelete(userId, url) {
    const eventId = this.extractEventId(url);
    await this.deleteEvent(userId, eventId);
    return { status: 204, headers: {}, body: '' };
  }

  async handleGet(userId, url) {
    const eventId = this.extractEventId(url);
    const event = await this.getEvent(userId, eventId);
    return {
      status: 200,
      headers: { 'Content-Type': 'text/calendar' },
      body: event.ical_data
    };
  }

  async getCalendars(userId) {
    const query = 'SELECT * FROM calendars WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getEvents(userId) {
    const query = 'SELECT * FROM calendar_events WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async saveEvent(userId, eventId, icalData) {
    const query = `
      INSERT INTO calendar_events (user_id, event_id, ical_data, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, event_id) 
      DO UPDATE SET ical_data = $3, updated_at = CURRENT_TIMESTAMP
    `;
    await this.pool.query(query, [userId, eventId, icalData]);
  }

  extractEventId(url) {
    return url.split('/').pop().replace('.ics', '');
  }

  buildCalendarCollectionResponse(calendars) {
    return `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  ${calendars.map(cal => `
  <d:response>
    <d:href>/caldav/${cal.user_id}/${cal.name}/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <d:displayname>${cal.display_name}</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`).join('')}
</d:multistatus>`;
  }

  buildEventsResponse(events) {
    return `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  ${events.map(event => `
  <d:response>
    <d:href>/caldav/${event.user_id}/${event.event_id}.ics</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-data>${event.ical_data}</c:calendar-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`).join('')}
</d:multistatus>`;
  }
}

module.exports = CalDAVService;