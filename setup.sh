#!/bin/bash

# Football Stream Recorder Setup Script
echo "🏈 Football Stream Recorder Setup"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration before running the application."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p backend/logs

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration:"
echo "   - S3 credentials for IDrive S3"
echo "   - Football API key (optional)"
echo "   - JWT secret"
echo ""
echo "2. Start the application:"
echo "   For development:"
echo "   npm run dev"
echo ""
echo "   For production with Docker:"
echo "   docker-compose up -d"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   Health check: http://localhost:5000/health"
echo ""
echo "4. To set up the database (development):"
echo "   cd backend && npm run db:migrate"
echo ""
echo "📚 For more information, see README.md"