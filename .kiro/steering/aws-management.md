# AWS Management

## Profiles

Two SSO profiles, both via Identity Center (`novare` session):

| Profile | Role | Use For |
|---------|------|---------|
| `mcp` | McpToolsAccess | ALL infrastructure ops (create/read/modify/delete resources) |
| `andras` | AdministratorAccess | IAM policy changes, Route 53 for mytimeblocks.app |

**In Kiro/IDE: ALWAYS use `--profile mcp`** (never bare `aws` commands).
Terminal alternative: `assume mcp` (Granted, exports env vars to shell only).

Account: 390503782314 | Region: eu-south-2 | Identity Center region: eu-central-1

## Session Management

- Sessions expire after 4 hours
- Re-auth: `aws sso login --profile mcp`
- Verify: `aws sts get-caller-identity --profile mcp`
- Cache: `~/.aws/sso/cache/` — never delete `kiro-auth-token.json`

**On expired session:** Stop, tell user to run `aws sso login --profile mcp`.
**On AccessDenied:** Stop, detail required IAM policies, wait for user to apply via `--profile andras`.

## Environments

### Current Setup

| | Production | Staging (future) |
|---|---|---|
| Frontend stack | `my-time-web-prod` | `my-time-web-stage` |
| Frontend URL | `https://app.mytimeblocks.app` | `https://stage.mytimeblocks.app` |
| API URL | `https://api.mytimeblocks.app` | `https://api-staging.mytimeblocks.app` (TBD) |
| Backend stack | `MyTimeStack` | `MyTimeStackStaging` (TBD) |

### Domain Setup

- Hosted zone: `mytimeblocks.app` (ID: `Z104198934Y1KNNHD8O5L`)
- Frontend cert: ACM wildcard `*.mytimeblocks.app` in us-east-1 (for CloudFront)
- Backend cert: `arn:aws:acm:eu-south-2:390503782314:certificate/ac3cc56b-66bb-4218-8d0d-19d249867ead`

**Note:** The `mytimeblocks.app` hosted zone requires the `andras` profile for manual changes (CDK uses cross-account DNS validation automatically).

## Tagging (Enforced by Policy)

All resources MUST have:
```
Creator=MCP_AI
Organization=Novare
Project=my-time
Environment=prod|staging
Service=web-hosting
CostCenter=my-time
CreatedDate=YYYY-MM-DD
Owner=andras
```

CDK applies via Aspects: `Environment=prod, Project=my-time, ManagedBy=cdk, Creator=MCP_AI`

## Naming

- Pattern: `my-time-web-[resource]-[env]`
- S3 bucket: `my-time-web-{env}-{account}`
- CDK stack: `my-time-web-{env}`

## Cost Governance

- Budget: `novare-monthly-total` — $715/month, alerts at 80%/100%
- Frontend hosting cost is negligible (S3 + CloudFront free tier covers most SPA traffic)
- **< €200/month**: proceed | **≥ €200/month**: require approval

## Security Defaults

- S3 bucket: private, block all public access, OAC only
- CloudFront: TLS 1.2+, HTTPS redirect, HTTP/2+3
- No direct S3 access — CloudFront OAC only

## Deployment

- Full deploy: `./deploy.sh prod` (builds, cdk deploy, s3 sync, CF invalidation)
- CDK only: `cd infra && cdk deploy my-time-web-prod --profile mcp --require-approval never`
- Sync only: `aws s3 sync dist/ s3://BUCKET --delete --profile mcp`
- Invalidate: `aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*" --profile mcp`
- S3 sync: use bash tool (MCP aws tool restricts local file paths to /tmp/aws-api-mcp/workdir)

## Regional

- Primary: `eu-south-2` (Spain) — S3 bucket region
- CloudFront: global edge network
- ACM cert: `us-east-1` (required for CloudFront)
- App domain: `mytimeblocks.app` (Route 53: Z104198934Y1KNNHD8O5L)
