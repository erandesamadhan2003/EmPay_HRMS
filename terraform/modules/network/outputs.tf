output "vnet_id" {
	description = "The ID of the virtual Network"
	value = azurerm_virtual_network.main.id
}

output "vnet_name" {
	description = "The name of the virtual Network"
	value = azurerm_virtual_network.main.name
}

output "aks_subnet_id" {
	description = "Subnet ID for AKS - passed to the AKS module"
	value = azurerm_subnet.aks.id
}

output "database_subnet_id" {
	description = "Subnet ID for database workloads"
	value = azurerm_subnet.database.id
}


