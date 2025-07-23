pipeline {
    agent any

    environment {
        // Application configuration
        APP_NAME = 'survey-app'

        // Application ports
        BACKEND_PORT = '5050'
        FRONTEND_PORT = '5173'

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

                    # Stop and remove existing survey containers (ignore .env file missing)
                    docker-compose down  || true

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
                            # Verify docker-compose.yml exists
                            if [ ! -f "docker-compose.yml" ]; then
                                echo "Error: docker-compose.yml not found in current directory"
                                exit 1
                            fi

                            # Create .env file with actual environment variable values
                            cat > .env << EOF
# Database Configuration
MONGODB_URI=${MONGO_URI}

# Application Configuration
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
NODE_ENV=production

# Admin Configuration
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Frontend Configuration
VITE_BASE_URL=http://localhost:${BACKEND_PORT}
EOF

                            # Show the complete .env file for debugging
                            echo "Complete .env file content:"
                            cat .env

                            # Build and start services using existing docker-compose.yml
                            docker-compose up --build -d

                            # Wait for services to be ready
                            echo "Waiting for services to be ready..."
                            sleep 30

                            # Check service status
                            docker-compose ps
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
                    sleep 120

                    // Test frontend
                    sh '''
                        curl -f http://localhost:${FRONTEND_PORT} || exit 1
                        echo "Frontend is healthy"
                    '''

                    // Test admin dashboard
                    sh '''
                        curl -f http://localhost:${FRONTEND_PORT}/admin || exit 1
                        echo "Admin dashboard is accessible"
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
            echo "  Backend API: http://localhost:${BACKEND_PORT}/api"
            echo "  Frontend: http://localhost:${FRONTEND_PORT}"
            echo "  Admin Dashboard: http://localhost:${FRONTEND_PORT}/admin"
            // You can add notifications here (Slack, email, etc.)
        }
        failure {
            echo 'Deployment failed!'
            // You can add failure notifications here
        }
    }
}
