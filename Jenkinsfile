pipeline {
    agent any

    environment {
        // ── AWS / ECR ──────────────────────────────────────────────────
        AWS_REGION         = 'us-east-1'
        AWS_ACCOUNT_ID     = credentials('AWS_ACCOUNT_ID')          // Jenkins secret: plain text
        ECR_REPO_NAME      = 'nexpensefy-health'
        ECR_REGISTRY       = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_URI          = "${ECR_REGISTRY}/${ECR_REPO_NAME}"

        // ── EKS ───────────────────────────────────────────────────────
        EKS_CLUSTER_NAME   = 'nexpensefy-health-cluster'
        K8S_NAMESPACE      = 'nexpensefy'
        K8S_DEPLOYMENT     = 'nexpensefy-health'

        // ── Build metadata ────────────────────────────────────────────
        IMAGE_TAG          = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        // ── 1. Checkout ───────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH}  |  Commit: ${env.GIT_COMMIT}"
            }
        }

        // ── 2. Install & Lint ─────────────────────────────────────────
        stage('Install & Lint') {
            agent {
                docker {
                    image 'node:22-alpine'
                    args  '-u root'
                    reuseNode true
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm run lint'
            }
        }

        // ── 3. Build (Next.js) ────────────────────────────────────────
        stage('Build') {
            agent {
                docker {
                    image 'node:22-alpine'
                    args  '-u root'
                    reuseNode true
                }
            }
            environment {
                NEXT_TELEMETRY_DISABLED = '1'
            }
            steps {
                sh 'npm run build'
                echo 'Next.js build succeeded.'
            }
        }

        // ── 4. Docker Build & Push to ECR ─────────────────────────────
        stage('Docker Build & Push') {
            steps {
                withCredentials([
                    [
                        $class:            'AmazonWebServicesCredentialsBinding',
                        credentialsId:     'AWS_CREDENTIALS',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]
                ]) {
                    sh '''
                        # Authenticate Docker to ECR
                        aws ecr get-login-password \
                            --region "$AWS_REGION" | \
                        docker login \
                            --username AWS \
                            --password-stdin "$ECR_REGISTRY"

                        # Build multi-platform production image
                        docker build \
                            --platform linux/amd64 \
                            --build-arg NODE_ENV=production \
                            -t "$IMAGE_URI:$IMAGE_TAG" \
                            -t "$IMAGE_URI:latest" \
                            .

                        # Push both tags
                        docker push "$IMAGE_URI:$IMAGE_TAG"
                        docker push "$IMAGE_URI:latest"

                        echo "Pushed $IMAGE_URI:$IMAGE_TAG"
                    '''
                }
            }
        }

        // ── 5. Deploy to EKS ──────────────────────────────────────────
        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    [
                        $class:            'AmazonWebServicesCredentialsBinding',
                        credentialsId:     'AWS_CREDENTIALS',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]
                ]) {
                    sh '''
                        # Update kubeconfig for the target cluster
                        aws eks update-kubeconfig \
                            --region "$AWS_REGION" \
                            --name   "$EKS_CLUSTER_NAME"

                        # Ensure namespace exists
                        kubectl get namespace "$K8S_NAMESPACE" 2>/dev/null || \
                            kubectl create namespace "$K8S_NAMESPACE"

                        # Apply manifests
                        kubectl apply -f deployment.yml \
                            --namespace "$K8S_NAMESPACE"

                        # Update the image tag to the freshly built image
                        kubectl set image deployment/"$K8S_DEPLOYMENT" \
                            nexpensefy-health="$IMAGE_URI:$IMAGE_TAG" \
                            --namespace "$K8S_NAMESPACE"

                        # Wait for rollout to complete (max 5 minutes)
                        kubectl rollout status deployment/"$K8S_DEPLOYMENT" \
                            --namespace "$K8S_NAMESPACE" \
                            --timeout=300s
                    '''
                }
            }
        }
    }

    // ── Post actions ───────────────────────────────────────────────────
    post {
        success {
            echo "Deployment of ${IMAGE_URI}:${IMAGE_TAG} succeeded."
        }
        failure {
            echo "Pipeline failed. Rolling back deployment..."
            withCredentials([
                [
                    $class:            'AmazonWebServicesCredentialsBinding',
                    credentialsId:     'AWS_CREDENTIALS',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]
            ]) {
                sh '''
                    aws eks update-kubeconfig \
                        --region "$AWS_REGION" \
                        --name   "$EKS_CLUSTER_NAME" 2>/dev/null || true

                    kubectl rollout undo deployment/"$K8S_DEPLOYMENT" \
                        --namespace "$K8S_NAMESPACE" 2>/dev/null || true
                '''
            }
        }
        always {
            // Clean up dangling local images to save disk space
            sh 'docker image prune -f || true'
            cleanWs()
        }
    }
}
