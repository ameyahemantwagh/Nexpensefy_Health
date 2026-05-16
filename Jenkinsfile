pipeline {
    agent any

    parameters {
        string(name: 'AWS_CREDENTI ', defaultValue: '', description: 'Optional Jenkins Secret Text credential ID for AWS_ACCESS_KEY_ID')
        string(name: 'AWS_SECRET_ACCESS_KEY_CRED', defaultValue: '', description: 'Optional Jenkins Secret Text credential ID for AWS_SECRET_ACCESS_KEY')
    }

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
                script {
                    def pushCmd = '''
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

                    boolean usedBoundCreds = false
                    boolean usedInstanceRole = false
                    if (params.AWS_CREDENTIALS_ID?.trim()) {
                        echo "Trying AWS credentials ID: ${params.AWS_CREDENTIALS_ID}"
                        try {
                            withCredentials([
                                usernamePassword(
                                    credentialsId: params.AWS_CREDENTIALS_ID,
                                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                                )
                            ]) {
                                usedBoundCreds = true
                                sh pushCmd
                            }
                        } catch (Exception ex) {
                            echo "Could not use Jenkins credential ID '${params.AWS_CREDENTIALS_ID}'. Falling back to pre-set environment variables."
                            echo "Reason: ${ex.getMessage()}"
                        }
                    }

                    if (!usedBoundCreds && params.AWS_ACCESS_KEY_ID_CRED?.trim() && params.AWS_SECRET_ACCESS_KEY_CRED?.trim()) {
                        echo "Trying AWS secret text credentials IDs: ${params.AWS_ACCESS_KEY_ID_CRED} and ${params.AWS_SECRET_ACCESS_KEY_CRED}"
                        try {
                            withCredentials([
                                string(credentialsId: params.AWS_ACCESS_KEY_ID_CRED, variable: 'AWS_ACCESS_KEY_ID'),
                                string(credentialsId: params.AWS_SECRET_ACCESS_KEY_CRED, variable: 'AWS_SECRET_ACCESS_KEY')
                            ]) {
                                usedBoundCreds = true
                                sh pushCmd
                            }
                        } catch (Exception ex) {
                            echo "Could not use AWS secret text credential IDs."
                            echo "Reason: ${ex.getMessage()}"
                        }
                    }

                    if (!usedBoundCreds) {
                        // If Jenkins node is on AWS with IAM role attached, AWS CLI can authenticate without static keys.
                        def roleCheck = sh(script: 'aws sts get-caller-identity >/dev/null 2>&1', returnStatus: true)
                        if (roleCheck == 0) {
                            echo 'Using IAM role credentials from Jenkins node (aws sts get-caller-identity succeeded).'
                            usedInstanceRole = true
                            sh pushCmd
                        } else {
                            sh '''
                                if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
                                    echo "ERROR: AWS credentials are not available."
                                    echo "Provide one of the following in Jenkins:"
                                    echo "1) AWS_CREDENTIALS_ID (Username/Password), or"
                                    echo "2) AWS_ACCESS_KEY_ID_CRED + AWS_SECRET_ACCESS_KEY_CRED (Secret Text), or"
                                    echo "3) IAM role on Jenkins node with ECR/EKS permissions."
                                    exit 1
                                fi
                            '''
                            sh pushCmd
                        }
                    }

                    if (usedBoundCreds) {
                        echo 'AWS authentication mode: Jenkins credentials binding.'
                    } else if (usedInstanceRole) {
                        echo 'AWS authentication mode: IAM role on Jenkins node.'
                    } else {
                        echo 'AWS authentication mode: pre-set environment variables.'
                    }
                }
            }
        }

        // ── 5. Deploy to EKS ──────────────────────────────────────────
        stage('Deploy to EKS') {
            steps {
                script {
                    def deployCmd = '''
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

                    boolean usedBoundCreds = false
                    boolean usedInstanceRole = false
                    if (params.AWS_CREDENTIALS_ID?.trim()) {
                        try {
                            withCredentials([
                                usernamePassword(
                                    credentialsId: params.AWS_CREDENTIALS_ID,
                                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                                )
                            ]) {
                                usedBoundCreds = true
                                sh deployCmd
                            }
                        } catch (Exception ex) {
                            echo "Could not use Jenkins credential ID '${params.AWS_CREDENTIALS_ID}' for deploy. Falling back to pre-set environment variables."
                            echo "Reason: ${ex.getMessage()}"
                        }
                    }

                    if (!usedBoundCreds && params.AWS_ACCESS_KEY_ID_CRED?.trim() && params.AWS_SECRET_ACCESS_KEY_CRED?.trim()) {
                        try {
                            withCredentials([
                                string(credentialsId: params.AWS_ACCESS_KEY_ID_CRED, variable: 'AWS_ACCESS_KEY_ID'),
                                string(credentialsId: params.AWS_SECRET_ACCESS_KEY_CRED, variable: 'AWS_SECRET_ACCESS_KEY')
                            ]) {
                                usedBoundCreds = true
                                sh deployCmd
                            }
                        } catch (Exception ex) {
                            echo "Could not use AWS secret text credential IDs for deploy."
                            echo "Reason: ${ex.getMessage()}"
                        }
                    }

                    if (!usedBoundCreds) {
                        def roleCheck = sh(script: 'aws sts get-caller-identity >/dev/null 2>&1', returnStatus: true)
                        if (roleCheck == 0) {
                            echo 'Using IAM role credentials from Jenkins node for deploy.'
                            usedInstanceRole = true
                            sh deployCmd
                        } else {
                            sh '''
                                if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
                                    echo "ERROR: AWS credentials are not available for deploy."
                                    echo "Provide one of the following in Jenkins:"
                                    echo "1) AWS_CREDENTIALS_ID (Username/Password), or"
                                    echo "2) AWS_ACCESS_KEY_ID_CRED + AWS_SECRET_ACCESS_KEY_CRED (Secret Text), or"
                                    echo "3) IAM role on Jenkins node with ECR/EKS permissions."
                                    exit 1
                                fi
                            '''
                            sh deployCmd
                        }
                    }

                    if (usedBoundCreds) {
                        echo 'AWS deploy authentication mode: Jenkins credentials binding.'
                    } else if (usedInstanceRole) {
                        echo 'AWS deploy authentication mode: IAM role on Jenkins node.'
                    } else {
                        echo 'AWS deploy authentication mode: pre-set environment variables.'
                    }
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
