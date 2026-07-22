# EmPay HRMS Helm Deployment & Developer Guide

This guide outlines the prerequisites, cluster setup, and installation steps required to deploy the EmPay HRMS Helm chart to Azure Kubernetes Service (AKS).

---

## Installation Guide (Exact Order)

### Step 1 — Enable CSI Driver Addon on AKS

The `SecretProviderClass` requires the Azure Key Vault CSI driver. Enable it on your existing cluster:

```bash
az aks enable-addons \
  --resource-group empayhrms-rg \
  --name empayhrms-aks \
  --addons azure-keyvault-secrets-provider

# Verify it's running
kubectl get pods -n kube-system \
  -l app=secrets-store-csi-driver
```

*Wait until all driver pods are in the `Running` state before proceeding.*

---

### Step 2 — Install NGINX Ingress Controller

```bash
helm repo add ingress-nginx \
  https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=1

# Wait for external IP (2-3 minutes)
kubectl get service ingress-nginx-controller \
  -n ingress-nginx --watch
```

*When `EXTERNAL-IP` shows a public IP address, note it down. That is your cluster's public entry point.*

---

### Step 3 — Deploy the EmPay HRMS Chart

Once the prerequisites are ready:

```bash
helm install empayhrms . \
  -f values.yaml \
  -f values.secrets.yaml
```
