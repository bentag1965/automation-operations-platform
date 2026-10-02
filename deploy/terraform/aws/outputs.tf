output "application_url" {
  description = "HTTP URL for the reference API."
  value       = "http://${aws_lb.api.dns_name}"
}

output "health_url" {
  description = "API health endpoint."
  value       = "http://${aws_lb.api.dns_name}/health"
}

output "ecr_repository_url" {
  description = "ECR repository for the application image."
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "api_service_name" {
  description = "ECS API service name."
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "ECS worker service name."
  value       = aws_ecs_service.worker.name
}

output "migration_task_definition_arn" {
  description = "One-off schema migration task definition."
  value       = aws_ecs_task_definition.migration.arn
}

output "public_subnet_ids" {
  description = "Subnets used by ECS tasks and the ALB."
  value       = aws_subnet.public[*].id
}

output "ecs_security_group_id" {
  description = "Security group required when running the migration task."
  value       = aws_security_group.ecs.id
}

output "database_endpoint" {
  description = "Private RDS endpoint."
  value       = aws_db_instance.postgres.address
}
