# EmPay HRMS — Architecture Diagrams

## Diagram 1 — Complete DevOps Architecture

```mermaid
flowchart TD
    subgraph DEV["👨‍💻 Developer Workstation"]
        CODE["Source Code\nbackend / frontend / helm / terraform"]
        TF_CLI["terraform apply\n(once, bootstrap infra)"]
    end

    subgraph GH["🐙 GitHub"]
        REPO["github.com/empayhrms\nmain branch"]
        subgraph ACTIONS["GitHub Actions CI/CD"]
            direction TB
            CI["① ci.yaml\nbun test — backend\nbun test — frontend"]
            BUILD["② build-push.yaml\nDocker build backend\nDocker build frontend\nPush :latest + :sha to ACR"]
            DEPLOY["③ deploy.yaml\naz login SP\naz aks get-credentials\nhelm upgrade --install\nkubectl rollout status"]
            CI -->|"CI passes on main"| BUILD
            BUILD -->|"BUILD_AND_PUSH succeeds"| DEPLOY
        end
        SECRETS["GitHub Secrets\nACR_LOGIN_SERVER\nACR_USERNAME / PASSWORD\nAZURE_CLIENT_ID\nAZURE_CLIENT_SECRET\nAZURE_TENANT_ID\nAZURE_SUBSCRIPTION_ID\nHELM_VALUES_SECRETS"]
        REPO --> CI
        SECRETS -. "injected at runtime" .-> BUILD
        SECRETS -. "injected at runtime" .-> DEPLOY
    end

    subgraph AZURE["☁️ Microsoft Azure — centralindia"]
        subgraph TFSTATE["empayhrms-tfstate-rg\nTerraform State"]
            SA["Storage Account\nempaytfstate23799\nblob: empayhrms.terraform.tfstate"]
        end

        subgraph RG["empayhrms-rg\nMain Resource Group"]
            ACR["Azure Container Registry\nempayhrmsacr.azurecr.io\nbackend:sha\nfrontend:sha"]

            KV["Azure Key Vault\nempayhrms-kv-seir1z\nJWT_SECRET\nDB_PASSWORD\nREDIS_PASSWORD\nGROQ_API_KEY\nSMTP_USER / SMTP_PASS"]

            VNET["Virtual Network\nAKS Subnet"]

            subgraph AKS["AKS Cluster — empayhrms-aks\nKubernetes 1.35"]
                CLUSTER["Kubernetes Workloads\n(see Diagram 2)"]
            end

            LOGS["Log Analytics Workspace\nempayhrms-logs"]
        end
    end

    TF_CLI -->|"provisions"| RG
    CODE -->|"git push"| REPO
    BUILD -->|"docker push :sha"| ACR
    DEPLOY -->|"helm upgrade --install"| AKS
    ACR -->|"image pull"| AKS
    KV -->|"CSI Driver secrets injection"| AKS
    AKS -->|"container logs"| LOGS
    TF_CLI -. "state stored in" .-> SA

    style DEV fill:#1e1e2e,stroke:#cba6f7,color:#cdd6f4
    style GH fill:#1e1e2e,stroke:#89b4fa,color:#cdd6f4
    style ACTIONS fill:#181825,stroke:#89dceb,color:#cdd6f4
    style AZURE fill:#1e1e2e,stroke:#a6e3a1,color:#cdd6f4
    style RG fill:#181825,stroke:#a6e3a1,color:#cdd6f4
    style TFSTATE fill:#181825,stroke:#f38ba8,color:#cdd6f4
    style AKS fill:#11111b,stroke:#fab387,color:#cdd6f4
```

---

## Diagram 2 — Kubernetes Cluster Detail

```mermaid
flowchart TD
    INTERNET(["🌐 Internet\nHTTP traffic"])

    subgraph AKS["AKS Cluster — empayhrms-aks"]

        subgraph SYSTEM["kube-system namespace\n(System node pool)"]
            CSI["secrets-store-csi-driver\nAzure Key Vault provider"]
        end

        subgraph INGRESSNS["ingress-nginx namespace\nIngress controller"]
            NGINX_POD["ingress-nginx-controller\nService: LoadBalancer\nPublic entry point"]
        end

        subgraph APP["empayhrms namespace\nApplication workloads"]
            INGRESS["Ingress\nempayhrms-ingress\nnginx class\npath /api → backend-svc\npath / → frontend-svc"]

            subgraph FRONTEND["Frontend"]
                FE_SVC["frontend-svc\nClusterIP :80"]
                FE_DEP["Deployment\nempayhrms-frontend\nreplicas: 2"]
                FE_POD1["Pod\nnginx:alpine\nstatic dist/"]
                FE_POD2["Pod\nnginx:alpine\nstatic dist/"]
                FE_SVC --> FE_DEP
                FE_DEP --> FE_POD1
                FE_DEP --> FE_POD2
            end

            subgraph BACKEND["Backend"]
                BE_SVC["backend-svc\nClusterIP :3000"]
                BE_DEP["Deployment\nempayhrms-backend\nreplicas: 2"]
                BE_HPA["HPA\nmin:2 max:5\ncpu: 70%"]
                BE_POD1["Pod\nBun / Node.js\n:3000"]
                BE_POD2["Pod\nBun / Node.js\n:3000"]
                BE_SVC --> BE_DEP
                BE_DEP --> BE_POD1
                BE_DEP --> BE_POD2
                BE_HPA -. "scales" .-> BE_DEP
            end

            subgraph DATA["Data Layer"]
                PG_SVC_HEAD["postgres-headless-svc\nHeadless"]
                PG_SVC_CI["postgres-svc\nClusterIP :5432"]
                PG_SS["StatefulSet\npostgres:15\nstorage: 10Gi managed-csi"]

                REDIS_SVC["redis-svc\nClusterIP :6379"]
                REDIS_DEP["Deployment\nredis:6-alpine\nstorage: 2Gi managed-csi"]
            end

            CM["ConfigMap\nempayhrms-configmap\nDB_HOST, REDIS_HOST\nGROQ_MODEL, PORT…"]
            SPC["SecretProviderClass\nempayhrms-kv-secrets\nCSI → Azure Key Vault"]
            SEC["Secret\nempayhrms-kv-secrets\nJWT_SECRET, DB_PASSWORD\nREDIS_PASSWORD…"]
            APPSEC["Secret\nempayhrms-app-secrets\nGROQ_API_KEY, SMTP_USER\nSMTP_PASS"]
        end
    end

    subgraph AZURE_SERVICES["Azure Services"]
        KV2["Azure Key Vault\nempayhrms-kv-seir1z"]
        ACR2["Azure Container Registry\nempayhrmsacr.azurecr.io"]
        PV_PG["Azure Disk PVC\n10Gi managed-csi"]
        PV_REDIS["Azure Disk PVC\n2Gi managed-csi"]
    end

    INTERNET -->|"public HTTP/HTTPS"| NGINX_POD
    NGINX_POD -->|"routes to Ingress resource"| INGRESS
    INGRESS -->|"/api"| BE_SVC
    INGRESS -->|"/"| FE_SVC

    FE_POD1 -->|"frontend calls"| BE_SVC
    FE_POD2 -->|"frontend calls"| BE_SVC

    BE_POD1 -->|"DB queries"| PG_SVC_CI
    BE_POD2 -->|"DB queries"| PG_SVC_CI
    PG_SVC_CI --> PG_SS
    PG_SVC_HEAD --> PG_SS

    BE_POD1 -->|"cache"| REDIS_SVC
    BE_POD2 -->|"cache"| REDIS_SVC
    REDIS_SVC --> REDIS_DEP

    CSI -->|"mounts secrets"| SPC
    SPC -->|"syncs"| KV2
    SPC -->|"creates"| SEC
    SEC -. "env vars" .-> BE_POD1
    SEC -. "env vars" .-> BE_POD2
    APPSEC -. "env vars" .-> BE_POD1
    APPSEC -. "env vars" .-> BE_POD2
    CM -. "env vars" .-> BE_POD1
    CM -. "env vars" .-> BE_POD2

    PG_SS --- PV_PG
    REDIS_DEP --- PV_REDIS

    ACR2 -. "image pull" .-> FE_POD1
    ACR2 -. "image pull" .-> FE_POD2
    ACR2 -. "image pull" .-> BE_POD1
    ACR2 -. "image pull" .-> BE_POD2

    style AKS fill:#1e1e2e,stroke:#89b4fa,color:#cdd6f4
    style SYSTEM fill:#181825,stroke:#f38ba8,color:#cdd6f4
    style INGRESSNS fill:#181825,stroke:#f9e2af,color:#cdd6f4
    style APP fill:#181825,stroke:#a6e3a1,color:#cdd6f4
    style FRONTEND fill:#11111b,stroke:#89dceb,color:#cdd6f4
    style BACKEND fill:#11111b,stroke:#cba6f7,color:#cdd6f4
    style DATA fill:#11111b,stroke:#fab387,color:#cdd6f4
    style AZURE_SERVICES fill:#1e1e2e,stroke:#a6e3a1,color:#cdd6f4
```

### Production layout used by this chart

- `kube-system` hosts the AKS-managed add-ons, including the CSI driver.
- `ingress-nginx` hosts the public NGINX ingress controller installed by Helm.
- `empayhrms` hosts the application namespace where the backend, frontend, ingress object, database, Redis, ConfigMap, and secrets live.
- Traffic flow is Internet -> ingress controller LoadBalancer -> Ingress resource -> ClusterIP services -> pods.
- The backend and frontend deployments are scheduled to the `user` node pool through `nodeSelector: nodepool: user`.
