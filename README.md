# Football Stream Recorder

A comprehensive application for automatically recording football streams with a beautiful web dashboard.

## 🌟 Features

- **Manual Recording**: Paste stream URLs and record instantly
- **Automatic Recording**: Schedule recordings based on match schedules
- **Cloud Storage**: Store recordings on IDrive S3
- **Web Dashboard**: Beautiful, responsive React UI with Material-UI
- **Video Playback**: Stream and download recorded videos
- **Match Metadata**: Store and manage recording information
- **Real-time Monitoring**: Live status updates and notifications
- **Scheduler**: Cron-based automatic recording system

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Material-UI + React Query
- **Backend**: Node.js + Express + FFmpeg integration
- **Database**: PostgreSQL with connection pooling
- **Storage**: IDrive S3 compatible storage
- **Recording**: FFmpeg for professional stream capture
- **Scheduling**: Node-cron for automatic recordings
- **Deployment**: Docker + Docker Compose

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd football-stream-recorder

# Run the setup script
./setup.sh

# Edit your configuration
nano .env

# Start development
npm run dev
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm run install:all

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure your environment variables
# Edit .env files with your actual configuration

# Set up database
cd backend
npm run db:migrate
cd ..

# Start development servers
npm run dev
```

### Option 3: Docker Production Setup
```bash
# Clone and configure
git clone <your-repo-url>
cd football-stream-recorder
cp .env.example .env
# Edit .env with your configuration

# Start with Docker
docker-compose up -d

# Check status
docker-compose ps
```

## 📁 Project Structure

```
football-stream-recorder/
├── backend/                 # Node.js Express API
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── scripts/           # Database migrations
│   └── utils/             # Utility functions
├── frontend/               # React TypeScript UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── nginx/                 # Nginx configuration
├── docs/                  # Documentation
├── docker-compose.yml     # Docker orchestration
└── setup.sh              # Automated setup script
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

```env
# IDrive S3 Configuration
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_BUCKET=football-recordings
S3_ENDPOINT=https://your-endpoint.idrivee2.com
S3_REGION=us-east-1

# Football API Configuration (Optional)
FOOTBALL_API_KEY=your_football_api_key
FOOTBALL_API_URL=https://api.football-data.org/v4

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Database (for development)
DATABASE_URL=postgresql://username:password@localhost:5432/football_recorder
```

### Backend Configuration (`backend/.env`)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/football_recorder
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_BUCKET=football-recordings
S3_ENDPOINT=https://your-endpoint.idrivee2.com
S3_REGION=us-east-1
FOOTBALL_API_KEY=your_football_api_key
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
RECORDINGS_PATH=/tmp/recordings
MAX_RECORDING_DURATION=7200000
FFMPEG_PATH=/usr/bin/ffmpeg
```

### Frontend Configuration (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_APP_NAME=Football Stream Recorder
REACT_APP_VERSION=1.0.0
```

## 🎯 Usage

### Manual Recording
1. Navigate to "Recordings" → "New Recording"
2. Enter stream title and URL
3. Select quality and format
4. Click "Create Recording"
5. Start recording immediately or schedule for later

### Automatic Recording
1. Add matches via "Matches" → "Add Match"
2. Enable auto-recording for specific matches
3. Create schedules via "Schedules" → "Create Schedule"
4. The system will automatically start/stop recordings

### Video Management
1. View all recorded videos in "Videos"
2. Stream videos directly in the browser
3. Download videos for offline viewing
4. Manage video metadata and storage

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d postgres
npm run dev
```

### Production
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production with Nginx
```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d
```

## 📊 API Endpoints

### Recordings
- `GET /api/recordings` - List recordings
- `POST /api/recordings` - Create recording
- `POST /api/recordings/:id/start` - Start recording
- `POST /api/recordings/:id/stop` - Stop recording
- `DELETE /api/recordings/:id` - Delete recording

### Matches
- `GET /api/matches` - List matches
- `GET /api/matches/upcoming` - Upcoming matches
- `POST /api/matches` - Create match
- `POST /api/matches/sync` - Sync from API

### Videos
- `GET /api/videos` - List videos
- `GET /api/videos/:id/stream` - Get stream URL
- `GET /api/videos/:id/download` - Get download URL

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `POST /api/schedules/:id/execute` - Execute schedule

## 🔍 Monitoring

- **Health Check**: `GET /health`
- **Active Recordings**: Real-time status in dashboard
- **Logs**: Available in `backend/logs/` directory
- **Database**: PostgreSQL with connection pooling
- **Storage**: S3-compatible storage monitoring

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- FFmpeg
- Docker (optional)

### Development Commands
```bash
# Start development servers
npm run dev

# Start only backend
npm run server:dev

# Start only frontend
npm run client:dev

# Run database migrations
cd backend && npm run db:migrate

# Build for production
npm run build
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Integration tests
npm run test:integration
```

## 🚨 Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install FFmpeg: `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS)
   - Set FFMPEG_PATH in environment variables

2. **Database connection failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Run migrations: `cd backend && npm run db:migrate`

3. **S3 upload failed**
   - Verify S3 credentials in .env file
   - Check bucket permissions
   - Test S3 connection: `cd backend && node -e "require('./services/s3Service').testConnection()"`

4. **Stream recording failed**
   - Verify stream URL is accessible
   - Check FFmpeg logs in `backend/logs/`
   - Ensure sufficient disk space

### Logs
- Backend logs: `backend/logs/combined.log`
- Error logs: `backend/logs/error.log`
- Docker logs: `docker-compose logs -f`

## 📄 License

MIT License - For personal use only

## 🤝 Contributing

This is a private project for personal use. 

## 📞 Support

For issues and questions, please check the logs and troubleshooting section above.