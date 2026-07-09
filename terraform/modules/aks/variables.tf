variable "project" {
    type = string
}

variable "location" {
    type = string
}

variable "resource_group_name" {
    type = string
}

variable "aks_subnet_id" {
    description = "Subnet ID from network module - AKS nodes and pods get IPs from here"
    type = string
}

variable "node_vm_size" {
    type = string
}

variable "node_count_min" {
    type = number
}

variable "node_count_max" {
    type = number
}

variable "kubernetes_version" {
    type = string
}

variable "environment" {
    type = string
}

variable "log_analytics_workspace_id" {
    description = "Log Analytics Workspace ID for AKS monitoring"
    type = string
}