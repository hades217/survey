#!/bin/bash

echo "=== Survey App Deployment Script ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove old images
echo "🧹 Cleaning up old images..."
docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Build and start services
echo "🚀 Building and starting services..."
docker-compose up --build -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose ps

# Health check
echo "🏥 Health checks:"
echo "Checking backend..."
if docker-compose exec backend wget --spider -q http://localhost:5050/api/surveys; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

echo "Checking frontend..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"  
else
    echo "❌ Frontend health check failed"
fi

echo ""
echo "🎉 Deployment complete!"
echo "Access your application at: http://localhost:80"
echo "Admin dashboard: http://localhost:80/admin"