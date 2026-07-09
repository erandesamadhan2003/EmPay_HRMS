variable "project" {
	type = string
}

variable "location" {
	type = string
}

variable "resource_group_name" {
	type = string
}

variable "aks_kubelet_identity_object_id" {
	description = "Object ID of AKS kubelet managed Identity. Gets AcrPull role on the registey."
	type = string
}
