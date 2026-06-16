#!/usr/bin/env bash
set -euo pipefail

# Deploy My Time Web to AWS
# Usage: ./deploy.sh [prod|stage]

ENV="${1:-prod}"
CERT_STACK="my-time-web-cert-${ENV}"
WEB_STACK="my-time-web-${ENV}"

echo "==> Building frontend..."
npm run build

echo "==> Deploying CDK stacks: ${CERT_STACK}, ${WEB_STACK}..."
cd infra
pip install -q -r requirements.txt
cdk deploy "${CERT_STACK}" "${WEB_STACK}" --profile mcp --require-approval never --outputs-file cdk-outputs.json
cd ..

# Extract bucket name and distribution ID from outputs
BUCKET=$(jq -r ".\"${WEB_STACK}\".BucketName" infra/cdk-outputs.json)
DIST_ID=$(jq -r ".\"${WEB_STACK}\".DistributionId" infra/cdk-outputs.json)

echo "==> Syncing build to S3..."
aws s3 sync dist/ "s3://${BUCKET}" --delete --profile mcp

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" --profile mcp

SITE_URL=$(jq -r ".\"${WEB_STACK}\".SiteUrl" infra/cdk-outputs.json)
echo "==> Done! Site: ${SITE_URL}"
