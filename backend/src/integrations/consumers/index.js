const AppointmentIntegrationConsumer = require('./appointment-integration.consumer')
const { handleBillingProvisioning } = require('./billing-provisioning.consumer')
const { handleWalletTopup, handleWalletTopupFailed } = require('./wallet-provisioning.consumer')
const { handleSaleLoyaltyAccrual } = require('./loyalty-accrual.consumer')
const { handleSalePackageRedemption } = require('./package-redemption.consumer')

module.exports = {
  AppointmentIntegrationConsumer,
  handleBillingProvisioning,
  handleWalletTopup,
  handleWalletTopupFailed,
  handleSaleLoyaltyAccrual,
  handleSalePackageRedemption
}
