"""Static SPA hosting: S3 + CloudFront + ACM (us-east-1) + Route 53."""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    Duration,
    Tags,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_certificatemanager as acm,
    aws_route53 as route53,
    aws_route53_targets as targets,
)


def _apply_tags(scope: Construct, env_name: str) -> None:
    """Apply required tags (enforced by IAM policy)."""
    Tags.of(scope).add("Creator", "MCP_AI")
    Tags.of(scope).add("Organization", "Novare")
    Tags.of(scope).add("Project", "my-time")
    Tags.of(scope).add("Environment", env_name)
    Tags.of(scope).add("Service", "web-hosting")
    Tags.of(scope).add("CostCenter", "my-time")
    Tags.of(scope).add("CreatedDate", "2025-06-16")
    Tags.of(scope).add("Owner", "andras")
    Tags.of(scope).add("ManagedBy", "cdk")


class CertificateStack(Stack):
    """ACM certificate in us-east-1 (required for CloudFront)."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        domain_name: str,
        hosted_zone_id: str,
        env_name: str,
        **kwargs,
    ) -> None:
        kwargs["cross_region_references"] = True
        super().__init__(scope, construct_id, **kwargs)

        _apply_tags(self, env_name)

        zone = route53.HostedZone.from_hosted_zone_attributes(
            self,
            "HostedZone",
            hosted_zone_id=hosted_zone_id,
            zone_name=domain_name,
        )

        self.certificate = acm.Certificate(
            self,
            "Certificate",
            domain_name=f"*.{domain_name}",
            subject_alternative_names=[domain_name],
            validation=acm.CertificateValidation.from_dns(zone),
            certificate_name=f"my-time-web-{env_name}-cert",
        )


class MyTimeWebStack(Stack):
    """S3 + CloudFront static SPA hosting with custom domain."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        subdomain: str,
        domain_name: str,
        hosted_zone_id: str,
        certificate: acm.ICertificate,
        **kwargs,
    ) -> None:
        kwargs["cross_region_references"] = True
        super().__init__(scope, construct_id, **kwargs)

        full_domain = f"{subdomain}.{domain_name}"
        env_name = "prod" if subdomain == "app" else subdomain

        _apply_tags(self, env_name)

        # --- Hosted Zone lookup ---
        zone = route53.HostedZone.from_hosted_zone_attributes(
            self,
            "HostedZone",
            hosted_zone_id=hosted_zone_id,
            zone_name=domain_name,
        )

        # --- S3 Bucket (private, no public access) ---
        bucket = s3.Bucket(
            self,
            "SiteBucket",
            bucket_name=f"my-time-web-{env_name}-{self.account}",
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
        )

        # --- CloudFront Distribution ---
        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            domain_names=[full_domain],
            certificate=certificate,
            default_root_object="index.html",
            error_responses=[
                # SPA: serve index.html for client-side routing
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
            ],
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            http_version=cloudfront.HttpVersion.HTTP2_AND_3,
        )

        # --- Route 53 Alias Record ---
        route53.ARecord(
            self,
            "AliasRecord",
            zone=zone,
            record_name=full_domain,
            target=route53.RecordTarget.from_alias(
                targets.CloudFrontTarget(distribution)
            ),
        )

        # --- Outputs ---
        CfnOutput(self, "BucketName", value=bucket.bucket_name)
        CfnOutput(self, "DistributionId", value=distribution.distribution_id)
        CfnOutput(self, "DistributionDomain", value=distribution.distribution_domain_name)
        CfnOutput(self, "SiteUrl", value=f"https://{full_domain}")
