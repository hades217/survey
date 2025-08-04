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
					echo "=== Current Working Directory ==="
					pwd
					echo "=== File Listing ==="
					ls -la
					echo "=== Docker Compose Files Check ==="
					if [ -f "docker-compose.aws.yml" ]; then
						echo "✓ docker-compose.aws.yml exists"
					else
						echo "✗ docker-compose.aws.yml missing"
					fi
					if [ -f "docker-compose.prod.yml" ]; then
						echo "✓ docker-compose.prod.yml exists"  
					else
						echo "✗ docker-compose.prod.yml missing"
					fi
					echo "=== Key Files Check ==="
					if [ -f "server.js" ]; then
						echo "✓ server.js exists"
					else
						echo "✗ server.js missing"
					fi
					if [ -f "Dockerfile.backend" ]; then
						echo "✓ Dockerfile.backend exists"
					else
						echo "✗ Dockerfile.backend missing"
					fi
					if [ -d "client" ]; then
						echo "✓ client directory exists"
						echo "Client directory contents:"
						ls -la client/ | head -10
					else
						echo "✗ client directory missing"
					fi

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

						// Determine which compose file to use at Groovy level
						def composeFile = fileExists('docker-compose.aws.yml') ? 'docker-compose.aws.yml' : 'docker-compose.prod.yml'
						echo "Using compose file: ${composeFile}"

						withEnv(["COMPOSE_FILE=${composeFile}"]) {
							sh '''
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

							# Build and start services with detailed logging
							echo "=== Building and starting services ==="
							echo "Using compose file: $COMPOSE_FILE"

							# Show docker-compose configuration for debugging
							echo "=== Docker Compose Configuration ==="
							docker-compose -f $COMPOSE_FILE config

							# Build and start services
							echo "=== Starting docker-compose build ==="
							if ! docker-compose -f $COMPOSE_FILE up --build -d; then
								echo "ERROR: docker-compose up failed!"
								echo "=== Docker Compose Logs ==="
								docker-compose -f $COMPOSE_FILE logs
								echo "=== System Resources ==="
								df -h
								free -h 2>/dev/null || echo "free command not available"
								docker system df
								exit 1
							fi

							# Check if containers started successfully
							echo "=== Immediate container status after start ==="
							docker-compose -f $COMPOSE_FILE ps

							# Show any containers that might have exited
							echo "=== All containers (including exited) ==="
							docker ps -a --filter "label=com.docker.compose.project"

							# Wait for services to be ready
							echo "Waiting for services to be ready..."
							sleep 30

							# Check service status again after wait
							echo "=== Final service status after wait ==="
							docker-compose -f $COMPOSE_FILE ps

							# Show logs of all services for debugging
							echo "=== Container Logs for Debugging ==="
							echo "Showing logs for all services:"
							docker-compose -f $COMPOSE_FILE logs --tail 50 || echo "Could not get compose logs"
						'''
						}
						
						// Show individual container logs in a separate sh block to avoid Groovy parsing issues
						sh '''
							echo "=== Individual Container Logs ==="
							for container_id in $(docker ps -aq --filter "label=com.docker.compose.project"); do
								if [ -n "$container_id" ]; then
									container_name=$(docker ps -a --format "{{.Names}}" --filter "id=$container_id")
									echo "--- Logs for $container_name ---"
									docker logs --tail 30 $container_id 2>&1 || echo "Could not get logs for $container_name"
									echo ""
								fi
							done
						'''
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

					// Determine which compose file to use (same as deploy stage)
					def composeFile = fileExists('docker-compose.aws.yml') ? 'docker-compose.aws.yml' : 'docker-compose.prod.yml'
					echo "Using compose file for health check: ${composeFile}"

					withEnv(["COMPOSE_FILE=${composeFile}"]) {
						sh '''
							echo "=== Starting Health Check Debug Information ==="

							# Show current time
							echo "Current time: $(date)"

							echo "Using configuration file: $COMPOSE_FILE"

							# Check the exact 2 containers we expect: mongodb and app
							echo "=== Checking Expected Containers Status ==="
							
							# Check compose project status first
							echo "Docker Compose Status:"
							docker-compose -f $COMPOSE_FILE ps || echo "Could not get compose status"
							
							echo ""
							echo "=== Individual Container Analysis ==="
							
							# Check MongoDB container specifically
							echo "1. MongoDB Container Status:"
							MONGODB_CONTAINER=$(docker ps -a --filter "name=mongodb" --format "{{.Names}}" | head -1)
							if [ -n "$MONGODB_CONTAINER" ]; then
								echo "   Container name: $MONGODB_CONTAINER"
								echo "   Status: $(docker ps -a --filter "name=mongodb" --format "{{.Status}}" | head -1)"
								echo "   Health: $(docker inspect $MONGODB_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo 'No health check')"
								echo "   Running: $(docker inspect $MONGODB_CONTAINER --format='{{.State.Running}}' 2>/dev/null || echo 'Unknown')"
								if [ "$(docker inspect $MONGODB_CONTAINER --format='{{.State.Running}}' 2>/dev/null)" != "true" ]; then
									echo "   ❌ MongoDB is NOT running"
									echo "   Exit Code: $(docker inspect $MONGODB_CONTAINER --format='{{.State.ExitCode}}' 2>/dev/null || echo 'Unknown')"
									echo "   Error: $(docker inspect $MONGODB_CONTAINER --format='{{.State.Error}}' 2>/dev/null || echo 'None')"
									echo "   Recent logs:"
									docker logs --tail 10 $MONGODB_CONTAINER 2>&1 || echo "Could not get logs"
								else
									echo "   ✅ MongoDB is running correctly"
								fi
							else
								echo "   ❌ MongoDB container not found!"
							fi
							
							echo ""
							echo "2. App Container Status:" 
							APP_CONTAINER=$(docker ps -a --filter "name=app" --format "{{.Names}}" | head -1)
							if [ -n "$APP_CONTAINER" ]; then
								echo "   Container name: $APP_CONTAINER"
								echo "   Status: $(docker ps -a --filter "name=app" --format "{{.Status}}" | head -1)"
								echo "   Health: $(docker inspect $APP_CONTAINER --format='{{.State.Health.Status}}' 2>/dev/null || echo 'No health check')"
								echo "   Running: $(docker inspect $APP_CONTAINER --format='{{.State.Running}}' 2>/dev/null || echo 'Unknown')"
								echo "   Ports: $(docker ps -a --filter "name=app" --format "{{.Ports}}" | head -1)"
								if [ "$(docker inspect $APP_CONTAINER --format='{{.State.Running}}' 2>/dev/null)" != "true" ]; then
									echo "   ❌ App container is NOT running"
									echo "   Exit Code: $(docker inspect $APP_CONTAINER --format='{{.State.ExitCode}}' 2>/dev/null || echo 'Unknown')"
									echo "   Error: $(docker inspect $APP_CONTAINER --format='{{.State.Error}}' 2>/dev/null || echo 'None')"
									echo "   Recent logs:"
									docker logs --tail 15 $APP_CONTAINER 2>&1 || echo "Could not get logs"
								else
									echo "   ✅ App container is running"
									echo "   Internal port check (5050):"
									docker exec $APP_CONTAINER netstat -tlnp 2>/dev/null | grep :5050 || echo "   Port 5050 not listening inside container"
								fi
							else
								echo "   ❌ App container not found!"
							fi

						# Show container logs from compose project
						echo "=== Application Container Logs (last 20 lines) ==="
						# Get all containers from our compose project
						compose_containers=$(docker ps -q --filter "label=com.docker.compose.project" 2>/dev/null)
						if [ -n "$compose_containers" ]; then
							for container in $compose_containers; do
								container_name=$(docker ps --format "{{.Names}}" --filter "id=$container")
								echo "--- Logs for $container_name ---"
								docker logs --tail 20 $container 2>&1 || echo "Failed to get logs for $container_name"
								echo ""
							done
						else
							# Fallback to check app and mongodb containers specifically
							echo "No compose project containers found, checking app and mongodb containers:"
							app_containers=$(docker ps -aq --filter "name=app" 2>/dev/null)
							mongodb_containers=$(docker ps -aq --filter "name=mongodb" 2>/dev/null)

							for container in $app_containers $mongodb_containers; do
								if [ -n "$container" ]; then
									container_name=$(docker ps -a --format "{{.Names}}" --filter "id=$container")
									echo "--- Logs for $container_name ---"
									docker logs --tail 20 $container 2>&1 || echo "Failed to get logs for $container_name"
									echo ""
								fi
							done

							if [ -z "$app_containers" ] && [ -z "$mongodb_containers" ]; then
								echo "No application containers found to show logs"
							fi
						fi

						echo ""
						echo "=== Port Configuration Analysis ==="
						
						# Determine expected external port based on compose file
						if [ "$COMPOSE_FILE" = "docker-compose.aws.yml" ]; then
							EXPECTED_PORT=80
							INTERNAL_PORT=5050
							echo "Using AWS configuration - expecting external port 80 (mapped from internal 5050)"
						else
							EXPECTED_PORT=5050
							INTERNAL_PORT=5050
							echo "Using production configuration - expecting port 5050"
						fi
						
						echo "Expected external port: $EXPECTED_PORT"
						echo "Internal container port: $INTERNAL_PORT"
						
						# Check if the expected port is listening
						echo ""
						echo "=== Host Port Status ==="
						echo "Checking if port $EXPECTED_PORT is listening on host:"
						if netstat -tlnp 2>/dev/null | grep ":$EXPECTED_PORT " || ss -tlnp 2>/dev/null | grep ":$EXPECTED_PORT "; then
							echo "✅ Port $EXPECTED_PORT is listening on host"
							PORT=$EXPECTED_PORT
						else
							echo "❌ Port $EXPECTED_PORT is NOT listening on host"
							echo "All listening ports:"
							netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || echo "Could not get port information"
						fi

						# Test the expected port
						echo ""
						echo "=== Application Connectivity Test ==="
						echo "Testing HTTP connection to port $EXPECTED_PORT..."
						if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:$EXPECTED_PORT >/dev/null 2>&1; then
							echo "✅ Port $EXPECTED_PORT is accessible and responding"
							PORT=$EXPECTED_PORT
						else
							echo "❌ Port $EXPECTED_PORT connection failed"
							echo "Attempting to get response anyway for debugging:"
							curl -v --connect-timeout 5 --max-time 10 http://localhost:$EXPECTED_PORT 2>&1 | head -20 || echo "Could not connect at all"
						fi

						# If no port worked, show more debugging info
						if [ -z "$PORT" ]; then
							echo "=== DEBUGGING: No ports accessible ==="

							# Check if application containers are actually running
							echo "Application containers status:"
							docker ps --filter "label=com.docker.compose.project" --format "{{.Names}}: {{.Status}}" || echo "No compose project containers running"

							# Also check app and mongodb specifically
							echo "App and MongoDB containers status:"
							docker ps --filter "name=app" --format "{{.Names}}: {{.Status}}" || echo "No app containers running"
							docker ps --filter "name=mongodb" --format "{{.Names}}: {{.Status}}" || echo "No mongodb containers running"

							# Check container health for application containers
							echo "Application container health status:"
							compose_containers=$(docker ps -q --filter "label=com.docker.compose.project" 2>/dev/null)
							app_containers=$(docker ps -q --filter "name=app" 2>/dev/null)
							mongodb_containers=$(docker ps -q --filter "name=mongodb" 2>/dev/null)

							all_containers="$compose_containers $app_containers $mongodb_containers"
							if [ -n "$all_containers" ]; then
								for container in $all_containers; do
									if [ -n "$container" ]; then
										container_name=$(docker ps --format "{{.Names}}" --filter "id=$container")
										echo "Health check for $container_name:"
										docker inspect $container --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check defined for $container_name"
									fi
								done
							else
								echo "No application containers found for health check"
							fi

							# Show recent Docker events for application containers
							echo "Recent Docker events for application containers:"
							docker events --since 2m --until now 2>/dev/null | grep -E "(app|mongodb)" || echo "No recent events for app/mongodb containers"

							# Check if MongoDB is accessible from app containers
							echo "Testing MongoDB connectivity from app containers:"
							if [ -n "$app_containers" ]; then
								first_app_container=$(echo $app_containers | cut -d' ' -f1)
								docker exec $first_app_container nc -zv mongodb 27017 2>&1 || echo "MongoDB connectivity test failed from app container"
							else
								echo "No app containers available for MongoDB test"
							fi

							echo "Health check failed - no accessible ports found"
							exit 1
						fi

						# Only proceed with detailed tests if we have a working port
						if [ -n "$PORT" ]; then
							echo ""
							echo "=== Application Health Tests on Port $PORT ==="

							# Test application homepage
							echo "1. Testing homepage..."
							if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:$PORT >/dev/null 2>&1; then
								echo "   ✅ Homepage is accessible"
							else
								echo "   ❌ Homepage test failed"
								echo "   Response details:"
								curl -v --connect-timeout 5 --max-time 10 http://localhost:$PORT 2>&1 | head -10 || echo "   Could not get response"
							fi

							# Test backend API
							echo ""
							echo "2. Testing API endpoint (/api/surveys)..."
							if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:$PORT/api/surveys >/dev/null 2>&1; then
								echo "   ✅ API endpoint is accessible"
							else
								echo "   ❌ API endpoint test failed"
								echo "   Response details:"
								curl -v --connect-timeout 5 --max-time 10 http://localhost:$PORT/api/surveys 2>&1 | head -10 || echo "   Could not get response"
							fi

							# Test admin dashboard
							echo ""
							echo "3. Testing admin dashboard (/admin)..."
							if curl -f --connect-timeout 10 --max-time 30 -s http://localhost:$PORT/admin >/dev/null 2>&1; then
								echo "   ✅ Admin dashboard is accessible"
							else
								echo "   ❌ Admin dashboard test failed"
								echo "   Response details:"
								curl -v --connect-timeout 5 --max-time 10 http://localhost:$PORT/admin 2>&1 | head -10 || echo "   Could not get response"
							fi
						else
							echo ""
							echo "❌ HEALTH CHECK FAILED - No accessible port found"
							echo "Cannot proceed with application tests"
							exit 1
						fi

						echo "=== Health Check Completed Successfully ==="
						echo "Application is running on port $PORT"
					'''
					}
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
