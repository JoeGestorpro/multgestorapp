const AppointmentIntegrationConsumer = require('./appointment-integration.consumer')
const { handleBillingProvisioning } = require('./billing-provisioning.consumer')
const { handleWalletTopup, handleWalletTopupFailed } = require('./wallet-provisioning.consumer')

module.exports = {
  AppointmentIntegrationConsumer,
  handleBillingProvisioning,
  handleWalletTopup,
  handleWalletTopupFailed
}
