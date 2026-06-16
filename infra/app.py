#!/usr/bin/env python3
"""CDK app entry point for My Time Web static hosting."""

import aws_cdk as cdk

from stack import CertificateStack, MyTimeWebStack

app = cdk.App()

ACCOUNT = "390503782314"
HOSTED_ZONE_ID = "Z104198934Y1KNNHD8O5L"
DOMAIN_NAME = "mytimeblocks.app"

# --- Production ---
cert_prod = CertificateStack(
    app,
    "my-time-web-cert-prod",
    env=cdk.Environment(account=ACCOUNT, region="us-east-1"),
    domain_name=DOMAIN_NAME,
    hosted_zone_id=HOSTED_ZONE_ID,
    env_name="prod",
)

MyTimeWebStack(
    app,
    "my-time-web-prod",
    env=cdk.Environment(account=ACCOUNT, region="eu-south-2"),
    subdomain="app",
    domain_name=DOMAIN_NAME,
    hosted_zone_id=HOSTED_ZONE_ID,
    certificate=cert_prod.certificate,
)

# --- Stage (uncomment when ready) ---
# cert_stage = CertificateStack(
#     app,
#     "my-time-web-cert-stage",
#     env=cdk.Environment(account=ACCOUNT, region="us-east-1"),
#     domain_name=DOMAIN_NAME,
#     hosted_zone_id=HOSTED_ZONE_ID,
#     env_name="stage",
# )
#
# MyTimeWebStack(
#     app,
#     "my-time-web-stage",
#     env=cdk.Environment(account=ACCOUNT, region="eu-south-2"),
#     subdomain="stage",
#     domain_name=DOMAIN_NAME,
#     hosted_zone_id=HOSTED_ZONE_ID,
#     certificate=cert_stage.certificate,
# )

app.synth()
