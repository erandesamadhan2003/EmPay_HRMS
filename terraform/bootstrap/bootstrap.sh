#!/bin/bash
set -e


TFSTATE_RESOURCE_GROUP="empayhrms-tfstate-rg"
LOCATION="centralindia"
STORAGE_ACCOUNT_NAME="empaytfstate$RANDOM"
CONTAINER_NAME="tfstate"
SP_NAME="empayhrms-sp"

mkdir -p ~/Secrets/empayhrms
chmod 700 ~/Secrets/empayhrms

echo "==> Creating Terraform state Resource Group..."
az group create \
  --name $TFSTATE_RESOURCE_GROUP \
  --location $LOCATION \
  > ~/Secrets/empayhrms/resource_group.json

echo "==> Creating Storage Account: $STORAGE_ACCOUNT_NAME"
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $TFSTATE_RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  > ~/Secrets/empayhrms/storage_account.json

echo "==> Creating Blob Container..."
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT_NAME \
  > ~/Secrets/empayhrms/blob_container.json

echo "==> Creating Service Principal..."
az ad sp create-for-rbac \
  --name $SP_NAME \
  --role "Contributor" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)" \
  --sdk-auth \
  > ~/Secrets/empayhrms/service_principal.json

chmod 600 ~/Secrets/empayhrms/service_principal.json

echo ""
echo "=========================================="
echo "Bootstrap complete."
echo ""
echo "State RG:  $TFSTATE_RESOURCE_GROUP  ← managed manually, never by Terraform"
echo "App RG:    empayhrms-rg             ← created by terraform apply"
echo ""
echo "PUT THIS IN backend.tf:"
echo "  resource_group_name  = \"$TFSTATE_RESOURCE_GROUP\""
echo "  storage_account_name = \"$STORAGE_ACCOUNT_NAME\""
echo "=========================================="