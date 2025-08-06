const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Football Stream Recorder API',
      version: '1.0.0',
      description: 'API for recording football streams with automatic scheduling and cloud storage',
      contact: {
        name: 'API Support',
        email: 'support@footballrecorder.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.footballrecorder.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Recording: {
          type: 'object',
          required: ['title', 'stream_url'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the recording'
            },
            title: {
              type: 'string',
              description: 'Title of the recording'
            },
            description: {
              type: 'string',
              description: 'Description of the recording'
            },
            stream_url: {
              type: 'string',
              format: 'uri',
              description: 'URL of the stream to record'
            },
            status: {
              type: 'string',
              enum: ['pending', 'recording', 'completed', 'failed', 'cancelled'],
              description: 'Current status of the recording'
            },
            file_path: {
              type: 'string',
              description: 'Local file path of the recording'
            },
            s3_key: {
              type: 'string',
              description: 'S3 storage key for the recording'
            },
            s3_url: {
              type: 'string',
              format: 'uri',
              description: 'S3 URL for accessing the recording'
            },
            duration: {
              type: 'integer',
              description: 'Duration of the recording in seconds'
            },
            file_size: {
              type: 'integer',
              description: 'File size in bytes'
            },
            format: {
              type: 'string',
              default: 'mp4',
              description: 'Video format of the recording'
            },
            quality: {
              type: 'string',
              default: 'auto',
              description: 'Quality setting for the recording'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            started_at: {
              type: 'string',
              format: 'date-time',
              description: 'Recording start timestamp'
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Recording completion timestamp'
            },
            error_message: {
              type: 'string',
              description: 'Error message if recording failed'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the recording'
            }
          }
        },
        Match: {
          type: 'object',
          required: ['home_team', 'away_team', 'match_date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the match'
            },
            external_id: {
              type: 'string',
              description: 'External API identifier'
            },
            home_team: {
              type: 'string',
              description: 'Home team name'
            },
            away_team: {
              type: 'string',
              description: 'Away team name'
            },
            competition: {
              type: 'string',
              description: 'Competition or league name'
            },
            match_date: {
              type: 'string',
              format: 'date-time',
              description: 'Match date and time'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'live', 'finished', 'cancelled'],
              description: 'Current match status'
            },
            stream_url: {
              type: 'string',
              format: 'uri',
              description: 'Stream URL for the match'
            },
            recording_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated recording ID'
            },
            auto_record: {
              type: 'boolean',
              description: 'Whether to automatically record this match'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            metadata: {
              type: 'object',
              description: 'Additional match metadata'
            }
          }
        },
        Schedule: {
          type: 'object',
          required: ['scheduled_start'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the schedule'
            },
            match_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated match ID'
            },
            recording_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated recording ID'
            },
            scheduled_start: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled start time'
            },
            scheduled_end: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled end time'
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'completed', 'failed', 'cancelled'],
              description: 'Schedule status'
            },
            cron_expression: {
              type: 'string',
              description: 'Cron expression for recurring schedules'
            },
            auto_generated: {
              type: 'boolean',
              description: 'Whether this schedule was auto-generated'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            executed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Execution timestamp'
            },
            metadata: {
              type: 'object',
              description: 'Additional schedule metadata'
            }
          }
        },
        StreamSource: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Source name (SuperSport, YouTube Live Sport, FIFA+, CAF TV)'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Stream URL'
            },
            quality: {
              type: 'string',
              description: 'Available quality options'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'error'],
              description: 'Source status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error description'
            },
            code: {
              type: 'integer',
              description: 'Error code'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Football Stream Recorder API Documentation'
  })
};