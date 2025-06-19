pipeline {
    agent any

    environment {
        REPO_URL = 'https://github.com/Sacred29/ICT2116_SSD_Group7.git'
        BRANCH = 'main'
        REMOTE_USER = 'dev'
        SERVER1 = '35.212.199.251'
        DEPLOY_PATH = '/nextjs-app/data'
    }

    stages {
        stage('Clone from GitHub') {
            steps {
                git branch: "${BRANCH}", url: "${REPO_URL}"
            }
        }

        stage('Build Locally') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Deploy to Server 1') {
            steps {
                sshagent(['deploy-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER1} '
                        if [ ! -d "${DEPLOY_PATH}" ]; then
                            git clone ${REPO_URL} ${DEPLOY_PATH};
                        fi &&
                        cd ${DEPLOY_PATH} &&
                        git checkout ${BRANCH} &&
                        git pull origin ${BRANCH} &&
                        npm install &&
                        npm run build &&
                        pm2 delete nextapp || true &&
                        pm2 start npm --name nextapp -- start
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment completed!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
