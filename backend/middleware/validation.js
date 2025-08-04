const Joi = require('joi');
const logger = require('../utils/logger');

// Recording validation schema
const recordingSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  stream_url: Joi.string().uri().required(),
  quality: Joi.string().valid('best', 'good', 'medium').default('best'),
  format: Joi.string().valid('mp4', 'mkv', 'ts').default('mp4')
});

// Match validation schema
const matchSchema = Joi.object({
  home_team: Joi.string().min(1).max(100).required(),
  away_team: Joi.string().min(1).max(100).required(),
  competition: Joi.string().max(100).optional(),
  match_date: Joi.date().iso().required(),
  stream_url: Joi.string().uri().optional(),
  auto_record: Joi.boolean().default(false)
});

// Schedule validation schema
const scheduleSchema = Joi.object({
  match_id: Joi.string().uuid().optional(),
  recording_id: Joi.string().uuid().optional(),
  scheduled_start: Joi.date().iso().required(),
  scheduled_end: Joi.date().iso().optional(),
  cron_expression: Joi.string().optional()
});

// UUID validation schema
const uuidSchema = Joi.string().uuid().required();

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', errorDetails);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace the request property with the validated value
    req[property] = value;
    next();
  };
};

// Specific validation middlewares
const validateRecording = validate(recordingSchema);
const validateMatch = validate(matchSchema);
const validateSchedule = validate(scheduleSchema);

const validateRecordingId = validate(uuidSchema, 'params.id');
const validateMatchId = validate(uuidSchema, 'params.id');
const validateScheduleId = validate(uuidSchema, 'params.id');

// Query parameter validation
const validatePagination = (req, res, next) => {
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'title', 'status', 'match_date').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  });

  const { error, value } = paginationSchema.validate(req.query, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid pagination parameters',
      details: error.details.map(detail => detail.message)
    });
  }

  req.pagination = value;
  next();
};

// Stream URL validation
const validateStreamUrl = (req, res, next) => {
  const { stream_url } = req.body;
  
  if (!stream_url) {
    return res.status(400).json({
      success: false,
      error: 'Stream URL is required'
    });
  }

  // Check for common streaming formats
  const supportedFormats = ['.m3u8', '.ts', '.mp4', '.mkv'];
  const hasValidFormat = supportedFormats.some(format => 
    stream_url.toLowerCase().includes(format)
  );

  // Allow HTTP/HTTPS URLs
  const isValidProtocol = stream_url.startsWith('http://') || stream_url.startsWith('https://');

  if (!isValidProtocol) {
    return res.status(400).json({
      success: false,
      error: 'Stream URL must use HTTP or HTTPS protocol'
    });
  }

  // Log warning for potentially unsupported formats
  if (!hasValidFormat) {
    logger.warn(`Potentially unsupported stream format: ${stream_url}`);
  }

  next();
};

// Date range validation
const validateDateRange = (req, res, next) => {
  const { start_date, end_date } = req.query;

  if (start_date && end_date) {
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }

    req.dateRange = { startDate, endDate };
  }

  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds maximum limit (10GB)'
    });
  }

  const allowedTypes = ['video/mp4', 'video/x-matroska', 'video/quicktime'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only MP4, MKV, and MOV files are allowed'
    });
  }

  next();
};

module.exports = {
  validate,
  validateRecording,
  validateMatch,
  validateSchedule,
  validateRecordingId,
  validateMatchId,
  validateScheduleId,
  validatePagination,
  validateStreamUrl,
  validateDateRange,
  validateFileUpload
};