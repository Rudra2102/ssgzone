# SSGzone Communication Platform - Action Plan & Implementation Guide

**Document Purpose:** Provide step-by-step action plan to complete the communication platform  
**Priority Level:** URGENT - Security issues must be addressed first  
**Estimated Timeline:** 6-10 weeks

---

## EXECUTIVE ACTION ITEMS

### 🔴 IMMEDIATE (This Week)

**1. Add Authentication Middleware**
- **File:** `api-gateway/src/middleware/auth.js` (CREATE NEW)
- **Action:** Implement JWT verification for all communication routes
- **Impact:** Prevents unauthorized access
- **Effort:** 2-3 hours

```javascript
// api-gateway/src/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**2. Add Tenant Isolation Middleware**
- **File:** `api-gateway/src/middleware/tenantCheck.js` (CREATE NEW)
- **Action:** Verify user belongs to tenant
- **Impact:** Prevents cross-tenant data access
- **Effort:** 1-2 hours

```javascript
// api-gateway/src/middleware/tenantCheck.js
module.exports = (req, res, next) => {
  const tenantId = req.params.tenant_id;
  const userTenantId = req.user.tenant_id;
  
  if (tenantId !== userTenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

**3. Apply Middleware to Communication Routes**
- **File:** `api-gateway/src/routes/communication.js`
- **Action:** Add auth and tenant check to all routes
- **Impact:** Secures all endpoints
- **Effort:** 1-2 hours

```javascript
// At top of communication.js
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');

// Apply to all routes
router.use(auth);
router.use(tenantCheck);
```

**4. Add Rate Limiting**
- **File:** `api-gateway/src/middleware/rateLimit.js` (CREATE NEW)
- **Action:** Implement rate limiting middleware
- **Impact:** Prevents abuse
- **Effort:** 2-3 hours

---

### 🟠 WEEK 1-2 (High Priority)

**5. Complete Email System**

**5.1 Email Attachments**
- **File:** `api-gateway/src/routes/communication.js`
- **Add Endpoints:**
  - `POST /email/attachments/upload` - Upload file
  - `GET /email/attachments/:id/download` - Download file
  - `DELETE /email/attachments/:id` - Delete file
- **Effort:** 2-3 days

**5.2 Email Scheduling**
- **File:** `api-gateway/src/jobs/emailScheduler.js` (CREATE NEW)
- **Action:** Create job to process scheduled emails
- **Effort:** 2-3 days

**5.3 Email Search**
- **File:** `api-gateway/src/routes/communication.js`
- **Add Endpoint:** `GET /email/search?q=query`
- **Effort:** 1-2 days

---

### 🟠 WEEK 2-3 (High Priority)

**6. Implement Video System**

**6.1 Choose Video Provider**
- Options: Jitsi Meet, Twilio Video, Daily.co
- Recommendation: Jitsi (open-source, self-hosted option)
- **Effort:** 1 day (research & decision)

**6.2 Create Database Schema**
- **File:** `database/migrations/24_video_system.sql` (CREATE NEW)
- **Tables Needed:**
  - video_sessions
  - video_participants
  - video_recordings
- **Effort:** 1 day

**6.3 Implement Video API**
- **File:** `api-gateway/src/routes/video.js` (CREATE NEW)
- **Endpoints:**
  - `POST /video/sessions` - Start video call
  - `GET /video/sessions/:id` - Get session info
  - `POST /video/sessions/:id/end` - End call
  - `GET /video/recordings/:session_id` - Get recording
- **Effort:** 3-4 days

**6.4 Implement WebSocket Handlers**
- **File:** `api-gateway/src/websocket/videoSocket.js` (CREATE NEW)
- **Events:**
  - video_call_initiated
  - video_call_accepted
  - video_call_rejected
  - video_call_ended
  - screen_share_started
  - screen_share_stopped
- **Effort:** 2-3 days

**6.5 Build Frontend UI**
- **File:** `unified-login/src/VideoPanel.js` (CREATE NEW)
- **Components:**
  - Video call interface
  - Participant list
  - Screen share button
  - Recording indicator
- **Effort:** 3-4 days

---

### 🟠 WEEK 3-4 (High Priority)

**7. Implement Meeting System**

**7.1 Create Database Schema**
- **File:** `database/migrations/25_meeting_system.sql` (CREATE NEW)
- **Tables Needed:**
  - meetings
  - meeting_participants
  - meeting_notes
  - meeting_reminders
- **Effort:** 1 day

**7.2 Implement Meeting API**
- **File:** `api-gateway/src/routes/meetings.js` (CREATE NEW)
- **Endpoints:**
  - `POST /meetings` - Create meeting
  - `GET /meetings/:tenant_id` - List meetings
  - `PUT /meetings/:id` - Update meeting
  - `DELETE /meetings/:id` - Cancel meeting
  - `POST /meetings/:id/invite` - Send invitation
  - `POST /meetings/:id/rsvp` - RSVP to meeting
- **Effort:** 3-4 days

**7.3 Implement Meeting Reminders**
- **File:** `api-gateway/src/jobs/meetingReminder.js` (CREATE NEW)
- **Action:** Send reminders 15 min before meeting
- **Effort:** 1-2 days

**7.4 Build Frontend UI**
- **File:** `unified-login/src/MeetingPanel.js` (CREATE NEW)
- **Components:**
  - Meeting scheduler
  - Meeting list
  - Meeting details
  - RSVP interface
- **Effort:** 3-4 days

---

### 🟡 WEEK 4-5 (Medium Priority)

**8. Complete WhatsApp Integration**

**8.1 Integrate Meta API**
- **File:** `api-gateway/src/services/whatsappService.js` (CREATE NEW)
- **Action:** Implement Meta WhatsApp Business API client
- **Effort:** 2-3 days

**8.2 Implement Message Sending**
- **File:** `api-gateway/src/routes/communication.js` (Update)
- **Update Endpoint:** `POST /whatsapp/send`
- **Effort:** 1-2 days

**8.3 Implement Webhook Handlers**
- **File:** `api-gateway/src/routes/webhooks.js` (CREATE NEW)
- **Endpoints:**
  - `POST /webhooks/whatsapp/messages` - Receive messages
  - `POST /webhooks/whatsapp/status` - Receive status updates
- **Effort:** 1-2 days

**8.4 Implement Contact Management**
- **File:** `api-gateway/src/routes/communication.js` (Update)
- **Add Endpoints:**
  - `POST /whatsapp/contacts` - Add contact
  - `GET /whatsapp/contacts/:tenant_id` - List contacts
  - `PUT /whatsapp/contacts/:id` - Update contact
  - `DELETE /whatsapp/contacts/:id` - Delete contact
- **Effort:** 1-2 days

---

### 🟢 WEEK 5-6 (Lower Priority)

**9. Enhance Chat System**

**9.1 Message Search**
- **File:** `api-gateway/src/routes/communication.js` (Update)
- **Add Endpoint:** `GET /chat/messages/search`
- **Effort:** 1-2 days

**9.2 Message Pinning**
- **File:** `database/migrations/26_chat_enhancements.sql` (CREATE NEW)
- **Add Table:** chat_pinned_messages
- **Add Endpoints:**
  - `POST /chat/messages/:id/pin`
  - `DELETE /chat/messages/:id/pin`
  - `GET /chat/rooms/:room_id/pinned`
- **Effort:** 1-2 days

**9.3 Room Settings**
- **File:** `api-gateway/src/routes/communication.js` (Update)
- **Add Endpoints:**
  - `PUT /chat/rooms/:id/settings`
  - `GET /chat/rooms/:id/settings`
- **Effort:** 1-2 days

---

## DETAILED IMPLEMENTATION STEPS

### Step 1: Security Implementation (Days 1-5)

#### 1.1 Create Auth Middleware
```bash
# File: api-gateway/src/middleware/auth.js
# Copy the code from above
```

#### 1.2 Create Tenant Check Middleware
```bash
# File: api-gateway/src/middleware/tenantCheck.js
# Copy the code from above
```

#### 1.3 Update Communication Routes
```javascript
// At top of api-gateway/src/routes/communication.js
const auth = require('../middleware/auth');
const tenantCheck = require('../middleware/tenantCheck');

// Apply middleware to all routes
router.use(auth);

// Apply tenant check to routes with tenant_id parameter
router.use('/:tenant_id', tenantCheck);
```

#### 1.4 Create Rate Limit Middleware
```bash
# File: api-gateway/src/middleware/rateLimit.js
# Implement rate limiting logic
```

#### 1.5 Test Security
```bash
# Test without token - should return 401
curl http://localhost:4000/api/v1/communication/email/stats/demo

# Test with invalid tenant - should return 403
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:4000/api/v1/communication/email/stats/other_tenant
```

---

### Step 2: Email System Completion (Days 6-12)

#### 2.1 Email Attachments
```javascript
// Add to api-gateway/src/routes/communication.js

router.post('/email/attachments/upload', async (req, res) => {
  try {
    const { tenant_id, email_id } = req.body;
    const file = req.files?.attachment;
    
    if (!file) return res.status(400).json({ error: 'No file provided' });
    
    // Upload to S3/MinIO
    const fileUrl = await uploadFile(file);
    
    // Store in database
    const result = await pool.query(`
      INSERT INTO communication_files (tenant_id, user_id, file_name, file_path, file_size, file_type, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [tenant_id, req.user.id, file.name, fileUrl, file.size, file.type, file.mimetype]);
    
    res.json({ success: true, file_id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

#### 2.2 Email Scheduling Job
```javascript
// Create: api-gateway/src/jobs/emailScheduler.js

const schedule = require('node-schedule');
const { Pool } = require('pg');

const pool = new Pool({...});

function startEmailScheduler() {
  // Run every minute
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const result = await pool.query(`
        SELECT id, from_email, to_email, subject, html_content, text_content
        FROM email_queue
        WHERE status = 'pending' AND scheduled_at <= NOW()
        LIMIT 100
      `);
      
      for (const email of result.rows) {
        // Send email via SES
        await sendEmailViaSES(email);
        
        // Update status
        await pool.query(`
          UPDATE email_queue SET status = 'sent', sent_at = NOW()
          WHERE id = $1
        `, [email.id]);
      }
    } catch (error) {
      console.error('Email scheduler error:', error);
    }
  });
}

module.exports = { startEmailScheduler };
```

#### 2.3 Email Search
```javascript
// Add to api-gateway/src/routes/communication.js

router.get('/email/search', async (req, res) => {
  try {
    const { tenant_id, q, from, date_from, date_to } = req.query;
    
    let query = `
      SELECT id, from_email, subject, created_at
      FROM emails
      WHERE tenant_id = $1
    `;
    const params = [tenant_id];
    
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (subject ILIKE $${params.length} OR html_content ILIKE $${params.length})`;
    }
    
    if (from) {
      params.push(from);
      query += ` AND from_email = $${params.length}`;
    }
    
    if (date_from) {
      params.push(date_from);
      query += ` AND created_at >= $${params.length}`;
    }
    
    if (date_to) {
      params.push(date_to);
      query += ` AND created_at <= $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, emails: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});
```

---

### Step 3: Video System Implementation (Days 13-26)

#### 3.1 Create Video Database Schema
```sql
-- File: database/migrations/24_video_system.sql

CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  room_id UUID REFERENCES chat_rooms(id),
  initiator_id UUID NOT NULL,
  jitsi_room_name VARCHAR(255) UNIQUE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  recording_url VARCHAR(500),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE video_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  screen_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_sessions_tenant ON video_sessions(tenant_id);
CREATE INDEX idx_video_sessions_room ON video_sessions(room_id);
CREATE INDEX idx_video_participants_session ON video_participants(session_id);
```

#### 3.2 Create Video Routes
```javascript
// File: api-gateway/src/routes/video.js

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({...});

// Start video call
router.post('/sessions', async (req, res) => {
  try {
    const { tenant_id, room_id, initiator_id } = req.body;
    const jitsiRoomName = `ssgzone-${Date.now()}`;
    
    const result = await pool.query(`
      INSERT INTO video_sessions (tenant_id, room_id, initiator_id, jitsi_room_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, jitsi_room_name
    `, [tenant_id, room_id, initiator_id, jitsiRoomName]);
    
    res.json({
      success: true,
      session_id: result.rows[0].id,
      jitsi_room: result.rows[0].jitsi_room_name,
      jitsi_url: `https://meet.jit.si/${result.rows[0].jitsi_room_name}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start video call' });
  }
});

// End video call
router.post('/sessions/:session_id/end', async (req, res) => {
  try {
    const { session_id } = req.params;
    
    await pool.query(`
      UPDATE video_sessions
      SET ended_at = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
      WHERE id = $1
    `, [session_id]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end video call' });
  }
});

module.exports = router;
```

#### 3.3 Create Video Frontend Component
```javascript
// File: unified-login/src/VideoPanel.js

import React, { useState, useEffect } from 'react';

export default function VideoPanel({ roomId, userId }) {
  const [sessionId, setSessionId] = useState(null);
  const [jitsiUrl, setJitsiUrl] = useState(null);
  
  const startCall = async () => {
    const res = await fetch('/api/v1/video/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'demo', room_id: roomId, initiator_id: userId })
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setJitsiUrl(data.jitsi_url);
  };
  
  return (
    <div>
      <button onClick={startCall}>Start Video Call</button>
      {jitsiUrl && (
        <iframe
          src={jitsiUrl}
          style={{ width: '100%', height: '600px' }}
          allow="camera; microphone"
        />
      )}
    </div>
  );
}
```

---

### Step 4: Meeting System Implementation (Days 27-35)

#### 4.1 Create Meeting Database Schema
```sql
-- File: database/migrations/25_meeting_system.sql

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  organizer_id UUID NOT NULL,
  video_session_id UUID REFERENCES video_sessions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID,
  email VARCHAR(255),
  rsvp_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, tentative
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meetings_tenant ON meetings(tenant_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
```

#### 4.2 Create Meeting Routes
```javascript
// File: api-gateway/src/routes/meetings.js

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({...});

// Create meeting
router.post('/', async (req, res) => {
  try {
    const { tenant_id, title, description, scheduled_at, duration_minutes, organizer_id, participants } = req.body;
    
    const result = await pool.query(`
      INSERT INTO meetings (tenant_id, title, description, scheduled_at, duration_minutes, organizer_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [tenant_id, title, description, scheduled_at, duration_minutes, organizer_id]);
    
    const meetingId = result.rows[0].id;
    
    // Add participants
    for (const participant of participants) {
      await pool.query(`
        INSERT INTO meeting_participants (meeting_id, user_id, email)
        VALUES ($1, $2, $3)
      `, [meetingId, participant.user_id, participant.email]);
    }
    
    res.json({ success: true, meeting_id: meetingId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// List meetings
router.get('/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params;
    
    const result = await pool.query(`
      SELECT id, title, description, scheduled_at, duration_minutes, organizer_id
      FROM meetings
      WHERE tenant_id = $1
      ORDER BY scheduled_at DESC
    `, [tenant_id]);
    
    res.json({ success: true, meetings: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

module.exports = router;
```

---

## TESTING CHECKLIST

### Security Testing
- [ ] Test unauthenticated access (should return 401)
- [ ] Test cross-tenant access (should return 403)
- [ ] Test rate limiting (should return 429 after limit)
- [ ] Test SQL injection attempts (should be prevented)

### Email Testing
- [ ] Test email send
- [ ] Test email attachment upload
- [ ] Test email search
- [ ] Test email scheduling

### Chat Testing
- [ ] Test message send
- [ ] Test message reactions
- [ ] Test message editing
- [ ] Test message deletion
- [ ] Test typing indicators
- [ ] Test online status

### Video Testing
- [ ] Test video session creation
- [ ] Test video session end
- [ ] Test participant tracking
- [ ] Test Jitsi integration

### Meeting Testing
- [ ] Test meeting creation
- [ ] Test meeting invitation
- [ ] Test RSVP
- [ ] Test meeting reminders

---

## DEPLOYMENT CHECKLIST

### Before Deployment
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] API documentation updated

### Deployment Steps
1. Backup database
2. Run database migrations
3. Deploy API changes
4. Deploy frontend changes
5. Run smoke tests
6. Monitor logs for errors

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all endpoints working
- [ ] Test user workflows
- [ ] Gather user feedback

---

## TIMELINE SUMMARY

| Phase | Duration | Completion Date |
|-------|----------|-----------------|
| Phase 1: Security | 1 week | Week 1 |
| Phase 2: Email | 1 week | Week 2 |
| Phase 3: Video | 2 weeks | Week 4 |
| Phase 4: Meeting | 1 week | Week 5 |
| Phase 5: WhatsApp | 1 week | Week 6 |
| Phase 6: Chat Enhancements | 1 week | Week 7 |
| Phase 7: Notifications | 1 week | Week 8 |
| **TOTAL** | **8 weeks** | **End of Week 8** |

---

## RESOURCE REQUIREMENTS

### Development Team
- 1 Backend Developer (full-time)
- 1 Frontend Developer (full-time)
- 1 DevOps Engineer (part-time)
- 1 QA Engineer (part-time)

### Infrastructure
- PostgreSQL database
- Redis cache
- S3/MinIO for file storage
- Jitsi Meet server (for video)
- Email service (AWS SES)
- SMS service (Twilio)
- Push notification service (Firebase)

### Third-party Services
- Meta WhatsApp Business API
- Jitsi Meet
- AWS SES
- Twilio
- Firebase

---

**Next Action:** Start with Phase 1 (Security) immediately!
