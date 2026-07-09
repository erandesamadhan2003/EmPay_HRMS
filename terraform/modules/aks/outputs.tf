output "cluster_name" {
    description = "AKS cluster name - used in az aks get-credentials command"
    value = azurerm_kubernetes_cluster.main.name
}

output "kube_config_raw" {
    description = "Raw kubeconfig file content — used by GitHub Actions to authenticate with cluster"
    value = azurerm_kubernetes_cluster.main.kube_config_raw
    sensitive = true
}

output "kubelet_identity_object_id" {
    description = "Object ID of AKS kubelet identity — passed to ACR for AcrPull role assignment"
    value = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "cluster_identity_object_id" {
    description = "Object ID of AKS cluster identity — passed to key vault access policy"
    value = azurerm_kubernetes_cluster.main.identity[0].principal_id
   
}