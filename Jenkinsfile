String podSpec = '''
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: node
      image: node:18
      tty: true
      env:
        - name: HOME
          value: /home/jenkins/agent
      resources:
        requests:
          memory: 512Mi
          cpu: 1000m
        limits:
          memory: 2560Mi
          cpu: 4000m
  securityContext:
    runAsUser: 1000
  volumes:
  - name: docker-graph-storage
    emptyDir: {}
'''

pipeline {
    agent {
        kubernetes {
            yaml podSpec
        }
    }

    environment {
        commit = sh(
            returnStdout: true,
            script: 'git describe --always'
        ).trim()

        version = sh(
            returnStdout: true,
            script:
                'cat ./package.json | ' +
                'grep "version" | ' +
                'cut -d : -f2 | ' +
                "sed \'s:[\",]::g\'"
        ).trim()
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Build modules') {
            steps {
                container('node') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Publish tag to npm') {
            when {
                branch 'main'
            }
            steps {
                container('node') {
                    withCredentials([
                        string(
                            credentialsId: 'OvertureNPMAutomationToken',
                            variable: 'NPM_TOKEN'
                        ),
                        string(
                            credentialsId: 'OvertureSlackJenkinsWebhookURL',
                            variable: 'published_slackChannelURL'
                        )
                    ]) {
                        script {
                            // we still want to run the platform deploy even if this fails, hence try-catch
                            try {
                                sh 'git reset --hard HEAD'
                                sh 'git pull --tags'
                                sh "npm config set '//registry.npmjs.org/:_authToken' \"${NPM_TOKEN}\""
                                sh 'npm run publish'
                                sh "curl \
                                    -X POST \
                                    -H 'Content-type: application/json' \
                                        --data '{ \
                                            \"text\":\"New SQON-builder published succesfully: v.${version}\
                                            \n[Build ${env.BUILD_NUMBER}] (${env.BUILD_URL})\" \
                                        }' \
                                ${published_slackChannelURL}"
                            } catch (err) {
                                echo 'There was an error while publishing packages'
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        fixed {
            withCredentials([string(
                credentialsId: 'OvertureSlackJenkinsWebhookURL',
                variable: 'fixed_slackChannelURL'
            )]) {
                container('node') {
                    script {
                        if (env.BRANCH_NAME ==~ /(develop|main|test\S*)/) {
                            sh "curl \
                                -X POST \
                                -H 'Content-type: application/json' \
                                --data '{ \
                                    \"text\":\"Build Fixed: ${env.JOB_NAME}#${commit} \
                                    \n[Build ${env.BUILD_NUMBER}] (${env.BUILD_URL})\" \
                                }' \
                                ${fixed_slackChannelURL}"
                        }
                    }
                }
            }
        }

        success {
            withCredentials([string(
                credentialsId: 'OvertureSlackJenkinsWebhookURL',
                variable: 'success_slackChannelURL'
            )]) {
                container('node') {
                    script {
                        if (env.BRANCH_NAME ==~ /(test\S*)/) {
                            sh "curl \
                                -X POST \
                                -H 'Content-type: application/json' \
                                --data '{ \
                                    \"text\":\"Build tested: ${env.JOB_NAME}#${commit} \
                                    \n[Build ${env.BUILD_NUMBER}] (${env.BUILD_URL})\" \
                                }' \
                                ${success_slackChannelURL}"
                        }
                    }
                }
            }
        }

        unsuccessful {
            withCredentials([string(
                credentialsId: 'OvertureSlackJenkinsWebhookURL',
                variable: 'failed_slackChannelURL'
            )]) {
                container('node') {
                    script {
                        if (env.BRANCH_NAME ==~ /(develop|main|test\S*)/) {
                            sh "curl \
                                -X POST \
                                -H 'Content-type: application/json' \
                                --data '{ \
                                    \"text\":\"Build Failed: ${env.JOB_NAME}#${commit} \
                                    \n[Build ${env.BUILD_NUMBER}] (${env.BUILD_URL})\" \
                                }' \
                                ${failed_slackChannelURL}"
                        }
                    }
                }
            }
        }
    }
}

