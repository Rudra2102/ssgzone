const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"']/g, '');
};

const inputValidationMiddleware = (req, res, next) => {
  try {
    if (req.params.tenant_id) {
      if (typeof req.params.tenant_id !== 'string' || req.params.tenant_id.length === 0) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid tenant_id' });
      }
    }
    if (req.body && typeof req.body === 'object') {
      const { method, path } = req;
      if (method === 'POST' && path.includes('/email/send')) {
        const { tenant_id, to, subject } = req.body;
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ error: 'Bad Request', message: 'tenant_id is required and must be a string' });
        }
        if (!to || !validateEmail(to)) {
          return res.status(400).json({ error: 'Bad Request', message: 'to must be a valid email address' });
        }
        if (!subject || typeof subject !== 'string' || subject.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'subject is required and must be a non-empty string' });
        }
        req.body.subject = sanitizeString(req.body.subject);
        if (req.body.html_content) {
          req.body.html_content = sanitizeString(req.body.html_content);
        }
      }
      if (method === 'POST' && path.includes('/chat/rooms')) {
        const { tenant_id, name } = req.body;
        if (!tenant_id || typeof tenant_id !== 'string') {
          return res.status(400).json({ error: 'Bad Request', message: 'tenant_id is required' });
        }
        if (!name || typeof name !== 'string' || name.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'name is required and must be non-empty' });
        }
        if (name.length > 255) {
          return res.status(400).json({ error: 'Bad Request', message: 'name must be less than 255 characters' });
        }
        req.body.name = sanitizeString(req.body.name);
      }
      if (method === 'POST' && path.includes('/chat/messages')) {
        const { room_id, message } = req.body;
        if (!room_id || !validateUUID(room_id)) {
          return res.status(400).json({ error: 'Bad Request', message: 'room_id is required and must be a valid UUID' });
        }
        if (!message || typeof message !== 'string' || message.length === 0) {
          return res.status(400).json({ error: 'Bad Request', message: 'message is required and must be non-empty' });
        }
        if (message.length > 5000) {
          return res.status(400).json({ error: 'Bad Request', message: 'message must be less than 5000 characters' });
        }
        req.body.message = sanitizeString(req.body.message);
      }
    }
    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(400).json({ error: 'Bad Request', message: 'Input validation failed' });
  }
};

module.exports = inputValidationMiddleware;
