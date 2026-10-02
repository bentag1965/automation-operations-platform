variable "aws_region" {
  description = "AWS region for the reference deployment."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Base name used for AWS resources."
  type        = string
  default     = "automation-operations"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR range for the VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "image_tag" {
  description = "Application image tag expected in the ECR repository."
  type        = string
  default     = "latest"
}

variable "api_desired_count" {
  description = "Desired ECS task count for the API service."
  type        = number
  default     = 1
}

variable "worker_desired_count" {
  description = "Desired ECS task count for the worker service."
  type        = number
  default     = 1
}

variable "task_cpu" {
  description = "Fargate CPU units for API and worker tasks."
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate memory in MiB for API and worker tasks."
  type        = number
  default     = 512
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage in GiB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum autoscaled RDS storage in GiB."
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Application database name."
  type        = string
  default     = "automation"
}

variable "database_master_username" {
  description = "RDS master username. Password is managed by RDS/Secrets Manager."
  type        = string
  default     = "automation_admin"
}

variable "worker_poll_ms" {
  description = "Worker polling interval."
  type        = number
  default     = 1500
}

variable "deletion_protection" {
  description = "Enable RDS deletion protection."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final RDS snapshot when destroying the reference environment."
  type        = bool
  default     = true
}
