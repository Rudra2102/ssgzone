const Joi = require('joi');

const validateSaasRegistration = (req, res, next) => {
  const schema = Joi.object({
    saas_name: Joi.string().min(2).max(255).required(),
    saas_slug: Joi.string().alphanum().min(2).max(100).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

const validateTenantProvisioning = (req, res, next) => {
  const schema = Joi.object({
    saas_slug: Joi.string().alphanum().min(2).max(100).required(),
    company_name: Joi.string().min(2).max(255).required(),
    tenant_slug: Joi.string().alphanum().min(2).max(100).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

const validateUserCreation = (req, res, next) => {
  const schema = Joi.object({
    tenant_slug: Joi.string().alphanum().min(2).max(100).required(),
    saas_slug: Joi.string().alphanum().min(2).max(100).required(),
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().min(1).max(100).required(),
    password: Joi.string().min(8).max(128).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateSaasRegistration,
  validateTenantProvisioning,
  validateUserCreation
};