terraform {
    backend "azurem" {
        resource_group_name = "empayhrms-rg"
        storeage_account_name = "empaytfstate32394"
        container_name = "tfstate"
        key = "empayhrms.terraform.tfstate"
    }
}