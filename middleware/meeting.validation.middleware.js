const { body, validationResult } = require('express-validator');

/**
 * Validates preferredDate - accepts both ISO 8601 and YYYY-MM-DD formats
 */
const validateDate = (value) => {
  // ISO 8601 format: 2024-12-25T10:30:00Z or 2024-12-25T10:30:00.000Z
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  // Date only format: YYYY-MM-DD
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (isoDateRegex.test(value) || dateOnlyRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return true;
    }
  }
  throw new Error('Preferred date must be in ISO 8601 format (2024-12-25T10:30:00Z) or date format (YYYY-MM-DD)');
};

/**
 * Validates preferredTime - accepts both ISO time portion and HH:MM format
 */
const validateTime = (value) => {
  // ISO time format: HH:MM:SS or HH:MM:SS.mmm
  const isoTimeRegex = /^\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/;
  // Simple time format: HH:MM
  const simpleTimeRegex = /^\d{2}:\d{2}$/;
  
  if (isoTimeRegex.test(value) || simpleTimeRegex.test(value)) {
    const [hours, minutes] = value.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return true;
    }
  }
  throw new Error('Preferred time must be in format HH:MM or HH:MM:SS');
};

/**
 * Validates phone number - accepts international format
 */
const validatePhoneNumber = (value) => {
  // International phone number format (allows +, spaces, hyphens, parentheses)
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  
  if (phoneRegex.test(value) && value.replace(/\D/g, '').length >= 7) {
    return true;
  }
  throw new Error('Phone number must be in valid international format (minimum 7 digits)');
};

/**
 * Validation middleware for meeting booking requests
 */
const validateMeetingBooking = [
  body('usersName')
    .notEmpty()
    .withMessage('User name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('User name must be between 2 and 100 characters')
    .trim()
    .escape(),
    
  body('preferredDate')
    .notEmpty()
    .withMessage('Preferred date is required')
    .custom(validateDate),
    
  body('preferredTime')
    .notEmpty()
    .withMessage('Preferred time is required')
    .custom(validateTime),
    
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(validatePhoneNumber)
    .trim(),
    
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .trim(),
    
  body('source')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Source must not exceed 100 characters')
    .trim()
    .escape(),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        })),
        requestId: req.requestId || 'unknown'
      });
    }
    next();
  }
];

module.exports = {
  validateMeetingBooking
};


