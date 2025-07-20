pipeline {
    agent any

    environment {
        // Application configuration
        APP_NAME = 'survey-app'

        // Application ports
        BACKEND_PORT = '5050'
        FRONTEND_PORT = '5173'

        // Environment variables
        MONGODB_URI = 'mongodb+srv://admin:cbfdfee5a2a211a9653b69d1c941529e@jobpin-ai-uat.xjmjwoh.mongodb.net/jobpin?retryWrites=true&w=majority&appName=jobpin-ai-uat'
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

        stage('Stop Old Containers') {
            steps {
                echo 'Stopping old survey containers...'
                sh '''
                    # Change to the survey directory
                    cd ${WORKSPACE}/survey
                    pwd
                    ls -la

                    # Stop and remove existing survey containers
                    docker-compose down || true

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
                sh '''
                    # Change to the survey directory
                    cd ${WORKSPACE}/survey
                    pwd
                    ls -la

                    # Verify docker-compose.yml exists
                    if [ ! -f "docker-compose.yml" ]; then
                        echo "Error: docker-compose.yml not found in ${WORKSPACE}/survey"
                        exit 1
                    fi

                    # Build and start services using existing docker-compose.yml
                    docker-compose up --build -d

                    # Wait for services to be ready
                    echo "Waiting for services to be ready..."
                    sleep 30

                    # Check service status
                    docker-compose ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Performing health checks...'
                script {
                    // Wait for services to be ready
                    sleep 60

                    // Test backend API
                    sh '''
                        curl -f http://localhost:${BACKEND_PORT}/api/surveys || exit 1
                        echo "Backend API is healthy"
                    '''

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
