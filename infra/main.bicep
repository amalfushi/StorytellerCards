targetScope = 'subscription'

@description('Short lowercase prefix used to name the Azure resources.')
@minLength(3)
@maxLength(24)
param namePrefix string = 'storytellercards'

@description('Azure region for the resource group and application resources.')
param location string = 'westus3'

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
var webAppName = take(toLower('${namePrefix}-${resourceToken}'), 60)

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module application 'modules/application.bicep' = {
  name: 'storyteller-cards-application'
  scope: resourceGroup
  params: {
    appServiceSkuName: appServiceSkuName
    basicAuthPassword: basicAuthPassword
    location: location
    registryName: registryName
    webAppName: webAppName
  }
}

output resourceGroupName string = resourceGroup.name
output registryName string = application.outputs.registryName
output registryLoginServer string = application.outputs.registryLoginServer
output webAppName string = application.outputs.webAppName
output webAppUrl string = application.outputs.webAppUrl
