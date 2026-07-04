#!/bin/bash

set -e

RESOURCE_GROUP_NAME="empayhrms-rg"
LOCATION="centralindia"
STORAGE_ACCOUNT_NAME="empaytfstate$RANDOM"
CONTAINER_NAME="tfstate"
SP_NAME="empayhrms-sp"

mkdir -p ~/Secrets/empayhrms
chmod 700 ~/Secrets/empayhrms


echo "==> Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP_NAME \
  --location $LOCATION \
  > ~/Secrets/empayhrms/resource_group.json

echo "==> Creating Storage Account: $STORAGE_ACCOUNT_NAME"
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
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

