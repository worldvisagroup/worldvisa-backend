const express = require("express");
const multer = require("multer");
const { parsePdf } = require("../controllers/pdfParserController");
const { apiKeyMiddleware } = require("../utils/helperFunction");

const router = express.Router();

// Configure Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * POST /api/parse-pdf
 * 
 * Extracts text from uploaded PDF file
 * 
 * Headers:
 *   - api-key or x-api-key: API key for authentication
 * 
 * Body (multipart/form-data):
 *   - pdf or file: PDF file to parse
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "text": "Extracted text content...",
 *       "metadata": {
 *         "fileName": "document.pdf",
 *         "fileSize": 123456,
 *         "pageCount": 5,
 *         "processingTime": 0.234
 *       }
 *     }
 *   }
 */
router.post(
  "/",
  apiKeyMiddleware,
  (req, res, next) => {
    // Accept both 'pdf' and 'file' field names
    upload.fields([
      { name: 'pdf', maxCount: 1 },
      { name: 'file', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum limit of 10MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }
      
      // Set req.file to whichever field was used
      if (req.files) {
        req.file = req.files.pdf ? req.files.pdf[0] : (req.files.file ? req.files.file[0] : undefined);
      }
      
      next();
    });
  },
  parsePdf
);

module.exports = router;

