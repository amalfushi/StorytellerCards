targetScope = 'subscription'

@description('Short lowercase prefix used to name the Azure resources.')
@minLength(3)
@maxLength(24)
param namePrefix string = 'storytellercards'

@description('Azure region for the resource group and application resources.')
param location string = 'westus3'

@description('Optional globally unique App Service name. Leave empty to generate a subscription-specific name.')
param webAppName string = ''

@description('Create the registry and App Service plan. Set false when adding an app to existing infrastructure.')
param provisionSharedInfrastructure bool = true

@description('F1 minimizes cost but sleeps and has quotas. B1 is recommended for dependable vacation use.')
@allowed([
  'F1'
  'B1'
])
param appServiceSkuName string = 'B1'

@secure()
@description('Password used by the application HTTP Basic authentication middleware.')
param basicAuthPassword string

var resourceGroupName = '${namePrefix}-rg'
var resourceToken = uniqueString(subscription().id, namePrefix)
var registryName = take(toLower(replace('${namePrefix}${resourceToken}', '-', '')), 50)
var generatedWebAppName = take(toLower('${namePrefix}-${resourceToken}'), 60)
var resolvedWebAppName = empty(webAppName) ? generatedWebAppName : webAppName
var appServicePlanName = '${generatedWebAppName}-plan'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module sharedInfrastructure 'modules/shared-infrastructure.bicep' = if (provisionSharedInfrastructure) {
  name: 'storyteller-cards-shared-infrastructure'
  scope: resourceGroup
  params: {
    appServicePlanName: appServicePlanName
    appServiceSkuName: appServiceSkuName
    location: location
    registryName: registryName
  }
}

module application 'modules/application.bicep' = {
  name: 'storyteller-cards-application'
  scope: resourceGroup
  params: {
    appServicePlanName: appServicePlanName
    appServiceSkuName: appServiceSkuName
    basicAuthPassword: basicAuthPassword
    location: location
    registryName: registryName
    webAppName: resolvedWebAppName
  }
  dependsOn: [
    sharedInfrastructure
  ]
}

output resourceGroupName string = resourceGroup.name
output registryName string = application.outputs.registryName
output registryLoginServer string = application.outputs.registryLoginServer
output webAppName string = application.outputs.webAppName
output webAppUrl string = application.outputs.webAppUrl
