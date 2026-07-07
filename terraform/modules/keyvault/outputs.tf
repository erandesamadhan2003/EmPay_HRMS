output "vault_uri" {
  description = "Key Vault URI — used by AKS Secrets Store CSI driver in Phase 4"
  value       = azurerm_key_vault.main.vault_uri
}

output "vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}