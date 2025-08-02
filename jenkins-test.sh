#\!/bin/bash

echo "🚀 Simulating Jenkins CI/CD Pipeline..."

# 1. Stop Old Containers (Jenkins Stage)
echo "📦 Stage: Stop Old Containers"
docker-compose -f docker-compose.prod.yml down || true
docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true
docker image prune -f

# 2. Create Environment Variables (Jenkins Stage)
echo "🔧 Stage: Create Environment Variables"
cat > .env << EOL
MONGODB_URI=mongodb://mongodb:27017/survey
PORT=5050
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
EOL

echo "Environment file created:"
cat .env

# 3. Build and Deploy (Jenkins Stage)
echo "🏗️ Stage: Build and Deploy"
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 30

# 5. Check service status
echo "📋 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# 6. Health Checks (Jenkins Stage)
echo "🏥 Stage: Health Check"

# Test frontend
echo "Testing frontend..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

# Test backend API
echo "Testing backend API..."
if curl -f http://localhost:80/api/surveys > /dev/null 2>&1; then
    echo "✅ Backend API is accessible"
else
    echo "❌ Backend API test failed"
    exit 1
fi

# Test admin dashboard
echo "Testing admin dashboard..."
if curl -f http://localhost:80/admin > /dev/null 2>&1; then
    echo "✅ Admin dashboard is accessible"
else
    echo "❌ Admin dashboard test failed"
    exit 1
fi

echo ""
echo "🎉 Jenkins CI/CD Pipeline Simulation Complete\!"
echo "✅ All tests passed successfully"
echo ""
echo "🌐 Access URLs:"
echo "  Application: http://localhost:80"
echo "  Admin Dashboard: http://localhost:80/admin"
echo "  API: http://localhost:80/api"

