#!/usr/bin/env bash
set -e

echo "Deploying the-council-api to Google Cloud Run with Secret Manager bindings..."

gcloud run deploy the-council-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "GROQ_API_KEY=groq-api-key:latest" \
  --set-env-vars "NODE_ENV=production,NODE_OPTIONS=--dns-result-order=ipv4first" \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1

