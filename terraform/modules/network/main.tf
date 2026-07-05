resource "azurerm_virtual_network" "main" {
	name = "${var.project}-vnet"
	location = var.location
	resource_group_name = var.resource_group_name
	address_space = [var.vnet_cidr]

	tags = {
		project = var.project
		managed_by = "terraform"
	}
}

resource "azurerm_subnet" "aks" {
	name = "${var.project}-aks-subnet"
	resource_group_name = var.resource_group_name
	virtual_network_name = azurerm_virtual_network.main.name
	address_prefixes = [var.aks_subnet_cidr]
}

resource "azurerm_subnet" "database" {
  name                 = "${var.project}-db-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.db_subnet_cidr]
}

resource "azurerm_network_security_group" "aks" {
	name = "${var.project}-aks-nsg"
	location = var.location
	resource_group_name = var.resource_group_name

	security_rule {
		name = "allow-http-inbound"
		priority = 100
		direction = "Inbound"
		access = "Allow"
		protocol = "Tcp"
		source_port_range = "*"
		destination_port_range = "80"
		source_address_prefix = "Internet"
		destination_address_prefix = "*"
	}

	security_rule {
		name = "allow-https-inbound"
		priority = 110
		direction = "Inbound"
		access = "Allow"
		protocol = "Tcp"
		source_port_range = "*"
		destination_port_range = "443"
		source_address_prefix = "Internet"
		destination_address_prefix = "*"	
	}

	tags = {
		project = var.project
		managed_by = "terraform"
	}
}

resource "azurerm_network_security_group" "database" {
	name = "${var.project}-db-nsg"
	location = var.location
	resource_group_name = var.resource_group_name

	security_rule {
		name = "allow-postgres-from-aks"
		priority = 100
		direction = "Inbound"
		access = "Allow"
		protocol = "Tcp"
		source_port_range = "*"
		destination_port_range = "5432"
		source_address_prefix = var.aks_subnet_cidr
		destination_address_prefix = "*"
	}

	security_rule {
		name = "deny-all-other-inbound"
		priority = 4096
		direction = "Inbound"
		access = "Deny"
		protocol = "*"
		source_port_range = "*"
		destination_port_range = "*"
		source_address_prefix = "*"
		destination_address_prefix = "*"
	}
}

resource "azurerm_subnet_network_security_group_association" "database" {
	subnet_id = azurerm_subnet.database.id
	network_security_group_id = azurerm_network_security_group.database.id
}

resource "azurerm_subnet_network_security_group_association" "aks" {
	subnet_id = azurerm_subnet.aks.id
	network_security_group_id = azurerm_network_security_group.aks.id
}	
