pipeline {
    agent any

    environment {
        APP_NAME  = 'interswitch-merchant-portal'
        WEB_DIR   = 'web'
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
                    set -e
                    echo "Checking web directory..."
                    ls -la "${WEB_DIR}/"

                    for f in index.html style.css; do
                        if [ ! -s "${WEB_DIR}/$f" ]; then
                            echo "ERROR: $f missing or empty"
                            exit 1
                        fi
                        echo "OK: $f found"
                    done
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
                    set -e

                    # ---- Work out how to get write access to NGINX_DIR ----
                    if [ "$(id -u)" -eq 0 ]; then
                        SUDO=""
                    elif sudo -n true 2>/dev/null; then
                        SUDO="sudo -n"
                    elif [ -w "${NGINX_DIR}" ]; then
                        SUDO=""
                    else
                        echo "ERROR: user '$(id -un)' cannot write to ${NGINX_DIR} and passwordless sudo is not available."
                        echo "Fix on the Jenkins host (run once as root):"
                        echo "  echo 'jenkins ALL=(ALL) NOPASSWD: /bin/cp, /bin/rm, /usr/bin/find, /bin/chown, /bin/chmod, /usr/sbin/nginx, /bin/systemctl reload nginx' > /etc/sudoers.d/jenkins"
                        echo "  chmod 440 /etc/sudoers.d/jenkins"
                        echo "Alternative: chown -R jenkins ${NGINX_DIR}"
                        exit 1
                    fi

                    # ---- Detect the user nginx actually runs as (nginx vs www-data) ----
                    if id -u nginx >/dev/null 2>&1; then
                        NGINX_USER=nginx
                    elif id -u www-data >/dev/null 2>&1; then
                        NGINX_USER=www-data
                    else
                        NGINX_USER=root
                    fi
                    echo "Nginx runs as: ${NGINX_USER}"

                    echo "Cleaning previous deployment..."
                    $SUDO find "${NGINX_DIR}" -mindepth 1 -delete

                    echo "Copying new web files..."
                    $SUDO cp -r "${WEB_DIR}/." "${NGINX_DIR}/"

                    echo "Setting permissions..."
                    $SUDO chown -R "${NGINX_USER}:${NGINX_USER}" "${NGINX_DIR}"
                    $SUDO find "${NGINX_DIR}" -type d -exec chmod 755 {} +
                    $SUDO find "${NGINX_DIR}" -type f -exec chmod 644 {} +

                    echo "Testing Nginx configuration..."
                    $SUDO nginx -t

                    echo "Reloading Nginx..."
                    $SUDO systemctl reload nginx

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
                    set -e

                    echo "Waiting for Nginx..."
                    sleep 2

                    echo "Checking HTTP response..."
                    STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost)

                    if [ "$STATUS" != "200" ]; then
                        echo "FAILED: HTTP $STATUS"
                        exit 1
                    fi
                    echo "PASSED: HTTP 200 OK"

                    echo "Checking page content..."
                    if curl -s http://localhost | grep -qi 'Interswitch'; then
                        echo "PASSED: Content verified"
                    else
                        echo "FAILED: Expected Interswitch content not found"
                        exit 1
                    fi
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
            echo "Result: ${currentBuild.currentResult}"
        }
    }
}
