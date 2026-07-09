
output "resource_group_name" {
  description = "Resource group containing all resources"
  value       = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  description = "Run: az aks get-credentials --resource-group <rg> --name <this value>"
  value       = module.aks.cluster_name
}

output "acr_login_server" {
  description = "Update GitHub secret ACR_LOGIN_SERVER with this value"
  value       = module.acr.login_server
}

output "acr_admin_username" {
  description = "Update GitHub secret ACR_USERNAME with this value"
  value       = module.acr.admin_username
}

output "acr_admin_password" {
  description = "Update GitHub secret ACR_PASSWORD with this value"
  value       = module.acr.admin_password
  sensitive   = true
  # To see this: terraform output acr_admin_password
}

output "key_vault_uri" {
  description = "Key Vault URI — used in Phase 4 Helm chart for secret injection"
  value       = module.keyvault.vault_uri
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = module.keyvault.vault_name
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}