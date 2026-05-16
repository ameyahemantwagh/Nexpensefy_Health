pipeline {
    agent any

    // ── GitHub source of truth ────────────────────────────────────────────
    // Jenkins credential ID that holds your GitHub PAT (or SSH key).
    // Add it under: Manage Jenkins → Credentials → Global → Add Credentials
    //   Kind : Username with password  (username = GitHub username, password = PAT)
    //   ID   : GITHUB_CREDENTIALS
    environment {
        // ── GitHub ────────────────────────────────────────────────────
        GITHUB_REPO_URL    = 'https://github.com/bhagyashreeameyawagh-ai/Nexpensefy_Health.git'
        GITHUB_BRANCH      = 'main'                                     // branch to build & deploy
        GITHUB_CREDENTIALS = 'Finalproject'                             // Jenkins credential ID

        // ── AWS / ECR ──────────────────────────────────────────────────
        AWS_REGION         = 'ap-south-1'
        AWS_ACCOUNT_ID     = '041568220769'                           // AWS account ID (plain value)
        ECR_REPO_NAME      = 'nexpensefy_health'
        ECR_REGISTRY       = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_URI          = "${ECR_REGISTRY}/${ECR_REPO_NAME}"

        // ── EKS ───────────────────────────────────────────────────────
        EKS_CLUSTER_NAME   = 'nexpensefy-health-cluster'
        K8S_NAMESPACE      = 'nexpensefy'
        K8S_DEPLOYMENT     = 'nexpensefy-health'

        // ── Build metadata ────────────────────────────────────────────
        IMAGE_TAG          = 'latest'
    }

    // ── Trigger: rebuild automatically on every push to GITHUB_BRANCH ──
    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        // ── 1. Checkout from GitHub ───────────────────────────────────
        stage('Checkout') {
            steps {
                git(
                    url:           env.GITHUB_REPO_URL,
                    branch:        env.GITHUB_BRANCH,
                    credentialsId: env.GITHUB_CREDENTIALS,
                    changelog:     true,
                    poll:          true
                )
                echo "Branch: ${env.GIT_BRANCH}  |  Commit: ${env.GIT_COMMIT}"
            }
        }

        // ── 1.1 Resolve image tag from checked-out commit ───────────
        stage('Prepare Metadata') {
            steps {
                script {
                    def shortCommit = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${shortCommit}"
                    echo "Resolved IMAGE_TAG=${env.IMAGE_TAG}"
                }
            }
        }

        // ── 2. Install & Lint ─────────────────────────────────────────
        stage('Install & Lint') {
            steps {
                sh '''
                    docker run --rm \
                        -v "$PWD:/app" \
                        -w /app \
                        node:22-alpine \
                        sh -lc "npm ci && npm run lint"
                '''
            }
        }

        // ── 3. Build (Next.js) ────────────────────────────────────────
        stage('Build') {
            environment {
                NEXT_TELEMETRY_DISABLED = '1'
            }
            steps {
                sh '''
                    docker run --rm \
                        -e NEXT_TELEMETRY_DISABLED=1 \
                        -v "$PWD:/app" \
                        -w /app \
                        node:22-alpine \
                        sh -lc "npm ci && npm run build"
                '''
                echo 'Next.js build succeeded.'
            }
        }

        // ── 4. Docker Build & Push to ECR ─────────────────────────────
        stage('Docker Build & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'AWS_CREDENTIALS',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
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
                    usernamePassword(
                        credentialsId: 'AWS_CREDENTIALS',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
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
            echo "Pipeline failed. Skipping rollback in post block to avoid missing node/workspace context."
            echo "If needed, rollback manually: kubectl rollout undo deployment/${env.K8S_DEPLOYMENT} -n ${env.K8S_NAMESPACE}"
        }
        always {
            echo 'Post cleanup step skipped (node/workspace may be unavailable on early pipeline failures).'
        }
    }
}
