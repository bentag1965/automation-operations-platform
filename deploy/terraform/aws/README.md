# AWS Terraform Reference Deployment

This directory defines a portfolio-oriented AWS deployment for the Automation Operations Platform.

## Architecture

- VPC across two Availability Zones
- public subnets for the Application Load Balancer and ECS/Fargate tasks
- private subnets for PostgreSQL
- ECS/Fargate API service
- ECS/Fargate worker service
- RDS PostgreSQL
- ECR application repository
- CloudWatch logs
- RDS-managed credentials in Secrets Manager
- one-off ECS task definition for database migration

The reference design avoids a NAT Gateway to keep a demo deployment simpler and less expensive. ECS tasks receive public IPs for outbound access, while inbound API traffic is allowed only from the load balancer. RDS remains private.

## Cost Warning

`terraform plan` does not create infrastructure.

`terraform apply` creates billable AWS resources. Review the plan and expected charges before applying.

## Validate Without Deploying

```powershell
cd deploy\terraform\aws
terraform init -backend=false
terraform fmt -check
terraform validate
terraform plan
```

## Image and Database Bootstrap

The Terraform configuration creates an ECR repository, but the application image must be built and pushed before the ECS services can become healthy.

After the image exists, run the one-off migration task definition to apply `database/schema.sql`, then force a new deployment of the API and worker services.

The application supports standard PostgreSQL environment variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Local Docker Compose can continue using `DATABASE_URL`.

## Security Model

- RDS is not publicly reachable.
- PostgreSQL ingress is allowed only from the ECS task security group.
- API task ingress on port 3000 is allowed only from the ALB security group.
- Database credentials are generated and managed by RDS/Secrets Manager.
- The ECS execution role is granted read access only to the RDS-managed secret required by the tasks.

## Production Hardening Beyond This Reference

- HTTPS with ACM
- private ECS subnets plus VPC endpoints or NAT
- autoscaling
- Multi-AZ RDS
- WAF
- remote Terraform state with locking
- deployment alarms and rollback policy
- managed migration stage in CI/CD
- backup and restore exercises
- tighter IAM task roles
- custom DNS

## Destroy

If you intentionally deploy the reference environment, use `terraform destroy` only after reviewing the destruction plan.
