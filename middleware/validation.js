const { body, validationResult } = require('express-validator');

// Validation middleware for job opportunity requests
const validateJobOpportunityRequest = [
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters')
    .trim()
    .escape(),
    
  body('occupation')
    .notEmpty()
    .withMessage('Occupation is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Occupation must be between 2 and 100 characters')
    .trim()
    .escape(),
    
  body('clientName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters')
    .trim()
    .escape(),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateJobOpportunityRequest
};
