terraform {
    backend "azurerm" {
        resource_group_name = "empayhrms-tfstate-rg"
        storage_account_name = "empaytfstate23799"
        container_name = "tfstate"
        key = "empayhrms.terraform.tfstate"
    }
}