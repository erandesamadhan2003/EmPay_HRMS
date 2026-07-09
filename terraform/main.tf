resource "azurerm_resource_group" "main" {
    name    = "${var.project}-rg"
    location = var.location

    tags = {
        project     = var.project
        managed_by  = "terraform"
    }
}

resource "azurerm_log_analytics_workspace" "main" {
    name                = "${var.project}-logs"
    location            = var.location
    resource_group_name = azurerm_resource_group.main.name
    sku                 = "PerGB2018"
    retention_in_days   = 30
}

module "network" {
    source = "./modules/network"

    project             = var.project
    location            = var.location
    resource_group_name = azurerm_resource_group.main.name
}

module "aks" {
    source = "./modules/aks"

    project                  = var.project
    location                 = var.location
    resource_group_name      = azurerm_resource_group.main.name
    aks_subnet_id            = module.network.aks_subnet_id
    node_vm_size             = var.node_vm_size
    node_count_min           = var.node_count_min
    node_count_max           = var.node_count_max
    kubernetes_version       = var.kubernetes_version
    environment              = var.environment
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

module "acr" {
    source = "./modules/acr"

    project = var.project
    location = var.location
    resource_group_name = azurerm_resource_group.main.name
    aks_kubelet_identity_object_id = module.aks.kubelet_identity_object_id
}   

module "keyvault" {
    source = "./modules/keyvault"

    project = var.project
    location = var.location
    resource_group_name = azurerm_resource_group.main.name
    aks_managed_identity_object_id = module.aks.cluster_identity_object_id
    postgres_password = var.postgres_password
    redis_password = var.redis_password
    jwt_secret = var.jwt_secret
}