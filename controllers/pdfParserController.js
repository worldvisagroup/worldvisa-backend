const pdfParse = require('pdf-parse');

const parsePdf = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file provided. Please upload a PDF file using the "pdf" or "file" field name.'
      });
    }

    const file = req.file;
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes

    // Validate file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${maxFileSize / (1024 * 1024)}MB.`
      });
    }

    // Validate MIME type
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF files are allowed.'
      });
    }

    // Validate buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File buffer is empty or corrupted.'
      });
    }

    // Parse PDF
    let pdfData;
    try {
      pdfData = await pdfParse(file.buffer);
    } catch (parseError) {
      // Handle specific PDF parsing errors
      if (parseError.message && parseError.message.includes('password')) {
        return res.status(400).json({
          success: false,
          message: 'PDF is password-protected. Please provide an unprotected PDF file.'
        });
      }
      
      if (parseError.message && parseError.message.includes('Invalid PDF')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or corrupted PDF file. Please ensure the file is a valid PDF.'
        });
      }

      // Generic parsing error
      console.error('PDF parsing error:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse PDF file. The file may be corrupted or in an unsupported format.',
        error: process.env.NODE_ENV === 'development' ? parseError.message : undefined
      });
    }

    // Check if PDF has content
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'PDF file does not contain extractable text. The PDF may be image-based or empty.',
        data: {
          text: '',
          metadata: {
            fileName: file.originalname,
            fileSize: file.size,
            pageCount: pdfData.numpages || 0,
            processingTime: ((Date.now() - startTime) / 1000).toFixed(3)
          }
        }
      });
    }

    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(3);

    // Return successful response
    return res.status(200).json({
      success: true,
      data: {
        text: pdfData.text,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          pageCount: pdfData.numpages || 0,
          processingTime: parseFloat(processingTime)
        }
      }
    });

  } catch (error) {
    console.error('Unexpected error in PDF parser:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while processing the PDF file.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  parsePdf
};

