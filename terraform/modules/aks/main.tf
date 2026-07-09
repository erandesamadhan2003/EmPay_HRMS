resource "azurerm_kubernetes_cluster" "main" {
    name                = "${var.project}-aks"
    location            = var.location
    resource_group_name = var.resource_group_name

    dns_prefix = var.project

    kubernetes_version = var.kubernetes_version

    oidc_issuer_enabled = true

    workload_identity_enabled = true 

    default_node_pool {
        name    = "system"
        vm_size = "Standard_B2as_v2"

        node_count = 1

        vnet_subnet_id = var.aks_subnet_id

        type = "VirtualMachineScaleSets"

        os_disk_size_gb = 50

        only_critical_addons_enabled = true

        temporary_name_for_rotation = "poolrotation"
    }

    identity {
        type = "SystemAssigned"
    }

    network_profile {
        network_plugin = "azure"
        load_balancer_sku = "standard"

        outbound_type = "loadBalancer"
        
        service_cidr   = "172.16.0.0/16"
        dns_service_ip = "172.16.0.10"
    }

    oms_agent {
        log_analytics_workspace_id = var.log_analytics_workspace_id
    }

    tags = {
        environment = var.environment
        project     = var.project
        managed_by  = "terraform"
    }
}


# USER NODE POOL
resource "azurerm_kubernetes_cluster_node_pool" "user" {
    name                  = "user"
    kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id

    vm_size        = var.node_vm_size
    vnet_subnet_id = var.aks_subnet_id

    auto_scaling_enabled =  true
    min_count            = var.node_count_min
    max_count            = var.node_count_max

    os_disk_size_gb = 30

    node_labels = {
        "nodepool" = "user"
        "project"  = var.project
    }

    tags = {
        environment = var.environment
        managed_by  = "terraform"
    }
}