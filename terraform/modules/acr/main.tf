resource "azurerm_container_registry" "main" {
	name = "${replace(var.project, "-","")}acr"
	resource_group_name = var.resource_group_name
	location = var.location
	
	sku = "Basic"
	
	admin_enabled = true

	tags = {
		project = var.project
		managed_by = "terraform"
	}
}

# ROLE ASSIGNMENT
resource "azurerm_role_assignment" "aks_acr_pull" {
	principal_id = var.aks_kubelet_identity_object_id
	role_definition_name = "AcrPull"
	scope = azurerm_container_registry.main.id
	skip_service_principal_aad_check = true
}
