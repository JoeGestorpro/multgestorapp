const AppointmentIntegrationConsumer = require('./appointment-integration.consumer')
const { handleBillingProvisioning } = require('./billing-provisioning.consumer')

module.exports = {
  AppointmentIntegrationConsumer,
  handleBillingProvisioning
}
