output "vnet_id" {
	description = "The ID of the virtual Network"
	value = azurem_virtual_network.main.id
}

output "vnet_name" {
	description = "The name of the virtual Network"
	value = azurem_virtual_network.main.name
}

output "aks_subnet_id" {
	description = "Subnet ID for AKS - passed to the AKS module"
	value = azurem_subnet.aks.id
}

output "database_subnet_id" {
	description = "Subnet ID for database workloads"
	value = azurem_subnet.database.id
}


