data "azurerm_client_config" "current" {}

resource "random_string" "kv_suffix" {
	length = 6
	special = false
	upper = false
}

resource "azurerm_key_vault" "main" {
	name = "${var.project}-kv-${random_string.kv_suffix.result}"
	location = var.location
	resource_group_name = var.resource_group_name

	tenant_id = data.azurerm_client_config.current.tenant_id

	sku_name = "standard"

	soft_delete_retention_days = 7
	
	purge_protection_enabled = false

	access_policy {
		tenant_id = data.azurerm_client_config.current.tenant_id
		object_id = data.azurerm_client_config.current.object_id
		
		secret_permissions = [
			"Get",
			"List",
			"Set",
			"Delete",
			"Purge"
		]
	}

	access_policy {
		tenant_id = data.azurerm_client_config.current.tenant_id
		object_id = var.aks_managed_identity_object_id

		secret_permissions = ["Get", "List"]
	}

	tags = {
		project = var.project
		managed_by = "terraform"
	}
}

resource "azurerm_key_vault_secret" "postgres_password" {
	name = "postgres-password"
	value = var.postgres_password
	key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_password" {
	name= "redis-password"
	value = var.redis_password
	key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
	name = "jwt-secret"
	value = var.jwt_secret
	key_vault_id = azurerm_key_vault.main.id
}




