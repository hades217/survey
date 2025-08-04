pipeline {
	agent any

	environment {
		// Application configuration
		APP_NAME = 'survey-app'

		// Application port
		APP_PORT = '5050'

		ADMIN_USERNAME = 'admin'
		ADMIN_PASSWORD = 'password'
	}

	stages {
		stage('Checkout') {
			steps {
				echo 'Checking out source code...'
				checkout scm
			}
		}

		stage('Install Docker Compose') {
			steps {
				echo 'Installing Docker Compose...'
				sh '''
					# Check if Docker Compose is already installed
					if command -v docker-compose &> /dev/null; then
						echo "Docker Compose is already installed"
						docker-compose --version
					else
						echo "Installing Docker Compose..."

						# Install Docker Compose
						curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
						chmod +x /usr/local/bin/docker-compose

						# Verify installation
						docker-compose --version

						echo "Docker Compose installed successfully"
					fi
				'''
			}
		}

		stage('Stop Old Containers') {
			steps {
				echo 'Stopping old survey containers...'
				sh '''
					pwd
					ls -la

					# Stop and remove existing survey containers
					docker-compose -f docker-compose.prod.yml down || true
					docker-compose -f docker-compose.aws.yml down || true

					# Remove only survey-related images
					docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true

					# Clean up only dangling images (not used by any container)
					docker image prune -f
				'''
			}
		}

		stage('Build and Deploy') {
			steps {
				echo 'Building and deploying survey application...'
				withVault([configuration: [ vaultUrl: 'https://vault.jiangren.com.au', vaultCredentialId: 'Vault Credential', timeout: 120],
					vaultSecrets: [[path: 'jenkins_jr_academy/prod',
						secretValues: [
							[vaultKey: 'MONGO_URI']
						]
					]]
				]) {
					script {
						echo "Environment variables loaded from Vault"
						echo "MONGO_URI: ${MONGO_URI}"

						sh """
							# Verify docker-compose files exist
							if [ ! -f "docker-compose.prod.yml" ] && [ ! -f "docker-compose.aws.yml" ]; then
								echo "Error: No docker-compose configuration files found"
								exit 1
							fi

							# Create .env file with actual environment variable values
							cat > .env << EOF
							# Database Configuration
							MONGODB_URI=${MONGO_URI}

							# Application Configuration
							PORT=5050
							NODE_ENV=production

							# Admin Configuration
							ADMIN_USERNAME=${ADMIN_USERNAME}
							ADMIN_PASSWORD=${ADMIN_PASSWORD}
							EOF

							# Show the complete .env file for debugging
							echo "Complete .env file content:"
							cat .env

							# Use AWS-specific config if available, otherwise use standard prod config
							if [ -f "docker-compose.aws.yml" ]; then
								echo "Using AWS-specific configuration..."
								COMPOSE_FILE="docker-compose.aws.yml"
							else
								echo "Using standard production configuration..."
								COMPOSE_FILE="docker-compose.prod.yml"
							fi

							# Build and start services
							docker-compose -f \$COMPOSE_FILE up --build -d

							# Wait for services to be ready
							echo "Waiting for services to be ready..."
							sleep 30

							# Check service status
							docker-compose -f \$COMPOSE_FILE ps
						"""
					}
				}
			}
		}

		stage('Health Check') {
			steps {
				echo 'Performing health checks...'
				script {
					// Wait for services to be ready
					sleep 10

					sh '''
						echo "=== Starting Health Check Debug Information ==="
						
						# Show current time
						echo "Current time: $(date)"
						
						# Check which compose file was used
						if [ -f "docker-compose.aws.yml" ]; then
							COMPOSE_FILE="docker-compose.aws.yml"
							echo "Using AWS configuration file: $COMPOSE_FILE"
						else
							COMPOSE_FILE="docker-compose.prod.yml"
							echo "Using production configuration file: $COMPOSE_FILE"
						fi
						
						# Show detailed container status
						echo "=== Docker Container Status ==="
						docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
						
						# Show container logs for debugging
						echo "=== Container Logs (last 20 lines) ==="
						for container in $(docker ps -q); do
							container_name=$(docker ps --format "{{.Names}}" --filter "id=$container")
							echo "--- Logs for $container_name ---"
							docker logs --tail 20 $container 2>&1 || echo "Failed to get logs for $container_name"
							echo ""
						done
						
						# Check network connectivity
						echo "=== Network Status ==="
						docker network ls
						
						# Show which ports are actually listening
						echo "=== Listening Ports ==="
						netstat -tlnp 2>/dev/null | grep LISTEN || ss -tlnp | grep LISTEN || echo "Could not check listening ports"
						
						# Check if services are responding on expected ports
						echo "=== Port Connectivity Tests ==="
						
						# Test port 80
						echo "Testing port 80..."
						if curl -f --connect-timeout 5 --max-time 10 -v http://localhost:80 2>&1; then
							echo "✓ Port 80 is accessible"
							PORT=80
						else
							echo "✗ Port 80 failed"
						fi
						
						# Test port 5050
						echo "Testing port 5050..."
						if curl -f --connect-timeout 5 --max-time 10 -v http://localhost:5050 2>&1; then
							echo "✓ Port 5050 is accessible"
							if [ -z "$PORT" ]; then
								PORT=5050
							fi
						else
							echo "✗ Port 5050 failed"
						fi
						
						# If no port worked, show more debugging info
						if [ -z "$PORT" ]; then
							echo "=== DEBUGGING: No ports accessible ==="
							
							# Check if containers are actually running
							echo "Running containers:"
							docker ps --format "{{.Names}}: {{.Status}}"
							
							# Check container health if health checks are defined
							echo "Container health status:"
							docker ps --format "{{.Names}}: {{.Status}}" | while read line; do
								container_name=$(echo $line | cut -d: -f1)
								echo "Health check for $container_name:"
								docker inspect $container_name --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check defined"
							done
							
							# Show recent container events
							echo "Recent Docker events:"
							docker events --since 2m --until now 2>/dev/null || echo "Could not get Docker events"
							
							# Check if MongoDB is accessible (if using external DB)
							echo "Testing MongoDB connectivity from containers:"
							docker exec $(docker ps -q | head -1) nc -zv mongodb 27017 2>&1 || echo "MongoDB connectivity test failed"
							
							echo "Health check failed - no accessible ports found"
							exit 1
						fi
						
						echo "=== Application Health Tests on Port $PORT ==="
						
						# Test application homepage with detailed output
						echo "Testing homepage..."
						if curl -f --connect-timeout 10 --max-time 30 -v http://localhost:$PORT 2>&1; then
							echo "✓ Homepage is accessible"
						else
							echo "✗ Homepage test failed"
							echo "Attempting to get response anyway:"
							curl -v http://localhost:$PORT 2>&1 || true
							exit 1
						fi
						
						# Test backend API with detailed output
						echo "Testing API endpoint..."
						if curl -f --connect-timeout 10 --max-time 30 -v http://localhost:$PORT/api/surveys 2>&1; then
							echo "✓ API endpoint is accessible"
						else
							echo "✗ API endpoint test failed"
							echo "Attempting to get API response anyway:"
							curl -v http://localhost:$PORT/api/surveys 2>&1 || true
							# Don't exit here, continue with other tests
						fi
						
						# Test admin dashboard with detailed output
						echo "Testing admin dashboard..."
						if curl -f --connect-timeout 10 --max-time 30 -v http://localhost:$PORT/admin 2>&1; then
							echo "✓ Admin dashboard is accessible"
						else
							echo "✗ Admin dashboard test failed"
							echo "Attempting to get admin response anyway:"
							curl -v http://localhost:$PORT/admin 2>&1 || true
							# Don't exit here, continue
						fi
						
						echo "=== Health Check Completed Successfully ==="
						echo "Application is running on port $PORT"
					'''
				}
			}
		}
	}

	post {
		always {
			echo 'Pipeline completed'
			cleanWs()
		}
		success {
			echo 'Deployment successful!'
			echo 'Access your application at:'
			echo "  Application: http://localhost:5050"
			echo "  Admin Dashboard: http://localhost:5050/admin"
			echo "  API: http://localhost:5050/api"
			// You can add notifications here (Slack, email, etc.)
		}
		failure {
			echo 'Deployment failed!'
			// You can add failure notifications here
		}
	}
}
