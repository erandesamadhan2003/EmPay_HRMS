output "login_server" {
    description = "The login server of the Azure Container Registry."
    value       = azurerm_container_registry.main.login_server
}

output "admin_username" {
    description = "The admin username of the Azure Container Registry."
    value       = azurerm_container_registry.main.admin_username
}

output "admin_password" {
    description = "The admin password of the Azure Container Registry."
    value       = azurerm_container_registry.main.admin_password
    sensitive   = true
}

output "acr_id" {
    description = "The ID of the Azure Container Registry."
    value       = azurerm_container_registry.main.id
}