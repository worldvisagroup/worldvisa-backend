class PDFGenerationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

class TemplateNotFoundError extends PDFGenerationError {
  constructor(templatePath) {
    super(
      'Template files not found. Please run "npm run build:templates" first.',
      'TEMPLATE_NOT_FOUND',
      { 
        templatePath,
        hint: 'Run "npm run build:templates" to compile TypeScript templates',
      }
    );
  }
}

class RenderError extends PDFGenerationError {
  constructor(message, details = {}) {
    super(
      `Failed to render React component: ${message}`,
      'RENDER_ERROR',
      {
        ...details,
        hint: 'Check that reportData structure matches the expected schema',
      }
    );
  }
}

class PuppeteerError extends PDFGenerationError {
  constructor(message, details = {}) {
    super(
      `Puppeteer error: ${message}`,
      'PUPPETEER_ERROR',
      {
        ...details,
        hint: 'This may be a temporary issue. The request will be retried automatically.',
      }
    );
  }
}

class TimeoutError extends PDFGenerationError {
  constructor(step, timeout) {
    super(
      `PDF generation timed out during ${step}`,
      'TIMEOUT_ERROR',
      {
        step,
        timeout: `${timeout}ms`,
        hint: 'Try reducing the report data size or increase PDF_TIMEOUT environment variable',
      }
    );
  }
}

class ValidationError extends PDFGenerationError {
  constructor(message, missingFields = []) {
    super(
      `Validation error: ${message}`,
      'VALIDATION_ERROR',
      {
        missingFields,
        hint: 'Check the API documentation for required fields',
      }
    );
  }
}

module.exports = {
  PDFGenerationError,
  TemplateNotFoundError,
  RenderError,
  PuppeteerError,
  TimeoutError,
  ValidationError,
};

