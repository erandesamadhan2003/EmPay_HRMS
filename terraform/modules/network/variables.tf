variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group to create resources in"
  type        = string
}

variable "vnet_cidr" {
  description = "IP address range for the entire Virtual Network"
  type        = string
  default     = "10.0.0.0/8"
  # /8 means 16 million IP addresses. Large because AKS with Azure CNI
  # assigns real VNet IPs to every pod, not just nodes.
}

variable "aks_subnet_cidr" {
  description = "IP range for the AKS subnet (nodes + pods)"
  type        = string
  default     = "10.0.1.0/24"
  # /24 = 256 addresses. Enough for learning. Production needs /16 for many pods.
}

variable "db_subnet_cidr" {
  description = "IP range for the database subnet (Postgres)"
  type        = string
  default     = "10.0.2.0/24"
}