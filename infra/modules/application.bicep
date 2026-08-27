param location string
param registryName string
param webAppName string
param appServiceSkuName string

@secure()
param basicAuthPassword string

var appServicePlanName = '${webAppName}-plan'
var appServiceSkuTier = appServiceSkuName == 'F1' ? 'Free' : 'Basic'
var acrPullRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d'
)

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: appServiceSkuName
    tier: appServiceSkuTier
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    serverFarmId: appServicePlan.id
    siteConfig: {
      acrUseManagedIdentityCreds: true
      alwaysOn: appServiceSkuName != 'F1'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      http20Enabled: true
      linuxFxVersion: 'DOCKER|mcr.microsoft.com/azuredocs/aci-helloworld:latest'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'BASIC_AUTH_PASSWORD'
          value: basicAuthPassword
        }
        {
          name: 'BASIC_AUTH_USERNAME'
          value: 'storyteller'
        }
        {
          name: 'STORYTELLER_DATA_DIR'
          value: '/home/data'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'STATIC_DIR'
          value: '/app/ui'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'true'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
      ]
    }
  }
}

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, webApp.id, acrPullRoleDefinitionId)
  scope: registry
  properties: {
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleDefinitionId
  }
}

output registryName string = registry.name
output registryLoginServer string = registry.properties.loginServer
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
