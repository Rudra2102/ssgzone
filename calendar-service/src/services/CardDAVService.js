const { Pool } = require('pg');

class CardDAVService {
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
      // Address book collection
      const addressBooks = await this.getAddressBooks(userId);
      const response = this.buildAddressBookCollectionResponse(addressBooks);
      return {
        status: 207,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        body: response
      };
    } else {
      // Individual contact
      const contact = await this.getContact(userId, url);
      const response = this.buildContactResponse(contact);
      return {
        status: 207,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        body: response
      };
    }
  }

  async handleReport(userId, body) {
    // Parse addressbook-query or addressbook-multiget
    const contacts = await this.getContacts(userId);
    const response = this.buildContactsResponse(contacts);
    return {
      status: 207,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      body: response
    };
  }

  async handlePut(userId, url, body) {
    const contactId = this.extractContactId(url);
    await this.saveContact(userId, contactId, body);
    return { status: 201, headers: {}, body: '' };
  }

  async handleDelete(userId, url) {
    const contactId = this.extractContactId(url);
    await this.deleteContact(userId, contactId);
    return { status: 204, headers: {}, body: '' };
  }

  async handleGet(userId, url) {
    const contactId = this.extractContactId(url);
    const contact = await this.getContact(userId, contactId);
    return {
      status: 200,
      headers: { 'Content-Type': 'text/vcard' },
      body: contact.vcard_data
    };
  }

  async getAddressBooks(userId) {
    const query = 'SELECT * FROM address_books WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getContacts(userId) {
    const query = 'SELECT * FROM contacts WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async saveContact(userId, contactId, vcardData) {
    const query = `
      INSERT INTO contacts (user_id, contact_id, vcard_data, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, contact_id) 
      DO UPDATE SET vcard_data = $3, updated_at = CURRENT_TIMESTAMP
    `;
    await this.pool.query(query, [userId, contactId, vcardData]);
  }

  extractContactId(url) {
    return url.split('/').pop().replace('.vcf', '');
  }

  buildAddressBookCollectionResponse(addressBooks) {
    return `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  ${addressBooks.map(book => `
  <d:response>
    <d:href>/carddav/${book.user_id}/${book.name}/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>
          <d:collection/>
          <card:addressbook/>
        </d:resourcetype>
        <d:displayname>${book.display_name}</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`).join('')}
</d:multistatus>`;
  }

  buildContactsResponse(contacts) {
    return `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  ${contacts.map(contact => `
  <d:response>
    <d:href>/carddav/${contact.user_id}/${contact.contact_id}.vcf</d:href>
    <d:propstat>
      <d:prop>
        <card:address-data>${contact.vcard_data}</card:address-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`).join('')}
</d:multistatus>`;
  }
}

module.exports = CardDAVService;