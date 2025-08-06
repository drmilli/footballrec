# Football Stream Recorder - Setup Instructions

A comprehensive application for automatically recording football streams with streaming sources integration (SuperSport, YouTube Live Sport, FIFA+, CAF TV).

## 🚀 Quick Setup Guide

### 1. Prerequisites

- Node.js 18+ installed
- Git installed
- A Neon PostgreSQL database account (free tier available)
- API keys for streaming services (optional but recommended)

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd football-stream-recorder

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup (Neon PostgreSQL)

#### Create Neon Database:
1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Create a new database named `footballrec`
4. Copy the connection string

#### Update Environment Files:

**Backend (.env file in `/backend/`):**
```env
# Replace with your actual Neon connection string
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/footballrec?sslmode=require

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# IDrive S3 Configuration (Optional - for cloud storage)
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_BUCKET=football-recordings
S3_ENDPOINT=https://your-endpoint.idrivee2.com
S3_REGION=us-east-1

# Football API Configuration (Optional)
FOOTBALL_API_KEY=your_football_api_key
FOOTBALL_API_URL=https://api.football-data.org/v4

# Recording Configuration
RECORDINGS_PATH=/tmp/recordings
MAX_RECORDING_DURATION=7200000
FFMPEG_PATH=/usr/bin/ffmpeg

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# Streaming Sources Configuration
SUPERSPORT_API_KEY=your_supersport_api_key
YOUTUBE_API_KEY=your_youtube_api_key
FIFA_PLUS_API_KEY=your_fifa_plus_api_key
CAF_TV_API_KEY=your_caf_tv_api_key
```

**Frontend (.env file in `/frontend/`):**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_APP_NAME=Football Stream Recorder
REACT_APP_VERSION=1.0.0
```

### 4. Database Migration

```bash
# Run from the backend directory
cd backend
npm run db:migrate
```

### 5. Start the Application

#### Option 1: Development Mode (Recommended)
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm start
```

#### Option 2: Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves both API and frontend)
cd ../backend
npm start
```

## 🌟 Features Overview

### Core Features
- **Manual Recording**: Paste stream URLs and record instantly
- **Automatic Recording**: Schedule recordings based on match schedules
- **Stream Sources Integration**: SuperSport, YouTube Live Sport, FIFA+, CAF TV
- **Cloud Storage**: Store recordings on IDrive S3
- **Web Dashboard**: Beautiful, responsive React UI with Material-UI
- **Video Playback**: Stream and download recorded videos
- **Real-time Monitoring**: Live status updates and notifications
- **Swagger Documentation**: Complete API documentation at `/api-docs`

### Streaming Sources
- **SuperSport**: Premium sports streaming platform
- **YouTube Live Sport**: Live sports streams on YouTube
- **FIFA+**: Official FIFA streaming service
- **CAF TV**: African football streaming service

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

### Main API Endpoints

#### Recordings
- `GET /api/recordings` - List recordings
- `POST /api/recordings` - Create recording
- `POST /api/recordings/:id/start` - Start recording
- `POST /api/recordings/:id/stop` - Stop recording
- `DELETE /api/recordings/:id` - Delete recording

#### Stream Sources
- `GET /api/stream-sources` - List all sources
- `GET /api/stream-sources/live` - Get all live streams
- `GET /api/stream-sources/:sourceId/streams` - Get streams from specific source
- `GET /api/stream-sources/:sourceId/test` - Test source connection

#### Matches & Schedules
- `GET /api/matches` - List matches
- `GET /api/schedules` - List schedules
- `POST /api/matches` - Create match
- `POST /api/schedules` - Create schedule

## 🛠️ Configuration

### Streaming API Keys

#### YouTube API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the key to your `.env` file as `YOUTUBE_API_KEY`

#### SuperSport API:
Contact SuperSport for API access (commercial license required)

#### FIFA+ API:
Check FIFA+ developer documentation for API access

#### CAF TV API:
Contact CAF (Confederation of African Football) for API access

### FFmpeg Installation

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

#### macOS:
```bash
brew install ffmpeg
```

#### Windows:
Download from [FFmpeg official website](https://ffmpeg.org/download.html)

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Verify your Neon connection string in `.env`
- Check if the database exists
- Ensure SSL mode is enabled for Neon

#### 2. FFmpeg Not Found
- Install FFmpeg using the instructions above
- Set `FFMPEG_PATH` in your `.env` file if needed

#### 3. API Keys Not Working
- Verify API keys are correct
- Check rate limits and quotas
- Ensure proper permissions are set

#### 4. Frontend Can't Connect to Backend
- Check if backend is running on port 5000
- Verify `REACT_APP_API_URL` in frontend `.env`
- Check for CORS issues

### Logs
- Backend logs: Check console output
- Frontend logs: Check browser developer console
- Database logs: Check Neon dashboard

## 🚀 Deployment

### Using Docker (Recommended)

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Set environment variables for production
3. Start backend:
```bash
cd backend
NODE_ENV=production npm start
```

## 📱 Usage Guide

### 1. Recording from Stream Sources
1. Navigate to "Stream Sources" in the sidebar
2. Browse available live streams
3. Click record button on any stream
4. Configure recording settings
5. Start recording

### 2. Manual Recording
1. Go to "Recordings" → "New Recording"
2. Enter stream title and URL
3. Select quality and format
4. Create and start recording

### 3. Scheduled Recording
1. Add matches via "Matches" → "Add Match"
2. Create schedules via "Schedules" → "Create Schedule"
3. System will auto-record based on schedule

### 4. Video Management
1. View recordings in "Videos"
2. Stream videos directly in browser
3. Download for offline viewing

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review API documentation at `/api-docs`
3. Check application logs
4. Verify configuration files

## 📄 License

MIT License - For personal use only