const database = require('../config/database');
const logger = require('../utils/logger');

const migrations = [
  {
    name: 'create_recordings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS recordings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        stream_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        file_path TEXT,
        s3_key TEXT,
        s3_url TEXT,
        duration INTEGER DEFAULT 0,
        file_size BIGINT DEFAULT 0,
        format VARCHAR(10) DEFAULT 'mp4',
        quality VARCHAR(20) DEFAULT 'auto',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `
  },
  {
    name: 'create_matches_table',
    sql: `
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id VARCHAR(100) UNIQUE,
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        competition VARCHAR(100),
        match_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        stream_url TEXT,
        recording_id UUID REFERENCES recordings(id),
        auto_record BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `
  },
  {
    name: 'create_schedules_table',
    sql: `
      CREATE TABLE IF NOT EXISTS schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID REFERENCES matches(id),
        recording_id UUID REFERENCES recordings(id),
        scheduled_start TIMESTAMP NOT NULL,
        scheduled_end TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        cron_expression VARCHAR(100),
        auto_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `
  },
  {
    name: 'create_settings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: 'create_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
      CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at);
      CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
      CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_start ON schedules(scheduled_start);
      CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    `
  }
];

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Test connection first
    const connected = await database.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Run each migration
    for (const migration of migrations) {
      logger.info(`Running migration: ${migration.name}`);
      await database.query(migration.sql);
      logger.info(`✅ Migration completed: ${migration.name}`);
    }

    logger.info('🎉 All migrations completed successfully!');
    
    // Insert default settings
    await insertDefaultSettings();
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
};

const insertDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'max_concurrent_recordings',
      value: '3',
      description: 'Maximum number of concurrent recordings allowed',
      category: 'recording'
    },
    {
      key: 'default_recording_quality',
      value: 'best',
      description: 'Default recording quality (best, good, medium)',
      category: 'recording'
    },
    {
      key: 'auto_cleanup_days',
      value: '30',
      description: 'Days after which completed recordings are cleaned up',
      category: 'storage'
    },
    {
      key: 'max_recording_duration',
      value: '7200',
      description: 'Maximum recording duration in seconds (2 hours)',
      category: 'recording'
    }
  ];

  for (const setting of defaultSettings) {
    try {
      await database.query(
        `INSERT INTO settings (key, value, description, category) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value, setting.description, setting.category]
      );
    } catch (error) {
      logger.warn(`Failed to insert setting ${setting.key}:`, error.message);
    }
  }
  
  logger.info('✅ Default settings inserted');
};

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };