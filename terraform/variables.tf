variable "location" {
	description = "Azure region for all resources. centralindia = Mumbai datacenter."
	type = string
	default = "centralindia"
}

variable "project" {
	description = "Short project name used as prefix for all Azure resource names"
	type = string
	default = "empayhrms"
}

variable "environment" {
  description = "Which environment: dev, staging, or prod"
  type        = string
  default     = "prod"
}

variable "node_vm_size" {
	description = "VM size for AKS worker nodes. D2s_v3 = 2 CPU, 8GB RAM."
	type = string
	default = "Standard_D2s_v3"
}

variable "node_count_min" {
	description = "Minimum nodes in user node pool. AKS scales Down to this under low load"
	type = number
	default = 1
}

variable "node_count_max" {
  description = "Maximum nodes in user node pool. AKS scales up to this under high load."
  type = number
  default = 3
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type = string
  default = "1.29"
}

variable "postgres_password" {
  description = "Postgresql superuser password. Stored in key Vault after creation"
  type = string
  sensitive = true
}

variable "redis_password" {
  description = "Redis Auth password"
  type = string
  sensitive = true
}
