pipeline {
    agent any

    environment {
        APP_NAME = 'interswitch-merchant-portal'
        WEB_DIR  = 'web'
        NGINX_DIR = '/var/www/html'
    }

    stages {

        // ================================================
        // STAGE 1: Validate web files
        // ================================================
        stage('Validate') {
            steps {
                echo '================================================'
                echo "Pipeline: ${APP_NAME} | Build: #${BUILD_NUMBER}"
                echo '================================================'

                sh '''
                    echo "Checking web directory..."
                    ls -la ${WEB_DIR}/
                '''

                sh '''
                    if [ ! -f ${WEB_DIR}/index.html ] || [ ! -s ${WEB_DIR}/index.html ]; then
                        echo "ERROR: index.html missing or empty"
                        exit 1
                    fi

                    echo "OK: index.html found"
                '''

                sh '''
                    if [ ! -f ${WEB_DIR}/style.css ] || [ ! -s ${WEB_DIR}/style.css ]; then
                        echo "ERROR: style.css missing or empty"
                        exit 1
                    fi

                    echo "OK: style.css found"
                '''

                echo 'Validate stage passed.'
            }
        }

        // ================================================
        // STAGE 2: Deploy directly to local Nginx
        // ================================================
        stage('Deploy') {
            steps {
                echo "Deploying ${APP_NAME} to local Nginx..."

                sh '''
                    echo "Cleaning previous deployment..."

                    sudo rm -rf ${NGINX_DIR}/*

                    echo "Copying new web files..."

                    sudo cp -r ${WEB_DIR}/. ${NGINX_DIR}/

                    echo "Setting permissions..."

                    sudo chown -R nginx:nginx ${NGINX_DIR}
                    sudo chmod -R 755 ${NGINX_DIR}

                    echo "Testing Nginx configuration..."

                    sudo nginx -t

                    echo "Reloading Nginx..."

                    sudo systemctl reload nginx

                    echo "Deployment completed successfully."
                '''
            }
        }

        // ================================================
        // STAGE 3: Verify site is live
        // ================================================
        stage('Health Check') {
            steps {
                sh '''
                    echo "Waiting for Nginx..."
                    sleep 2

                    echo "Checking HTTP response..."

                    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost)

                    if [ "$STATUS" -ne 200 ]; then
                        echo "FAILED: HTTP $STATUS"
                        exit 1
                    fi

                    echo "PASSED: HTTP 200 OK"

                    echo "Checking page content..."

                    curl -s http://localhost | grep -qi 'Interswitch'

                    if [ $? -ne 0 ]; then
                        echo "FAILED: Expected Interswitch content not found"
                        exit 1
                    fi

                    echo "PASSED: Content verified"
                '''
            }
        }
    }

    post {
        success {
            echo "BUILD #${BUILD_NUMBER} SUCCEEDED | ${currentBuild.durationString}"
        }

        failure {
            echo "BUILD #${BUILD_NUMBER} FAILED | Review console output above."
        }

        always {
            echo "Result: ${currentBuild.result ?: 'SUCCESS'}"
        }
    }
}