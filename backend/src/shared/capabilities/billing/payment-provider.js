class PaymentProvider {
  getProviderName() {
    throw new Error('PaymentProvider subclass must implement getProviderName()')
  }

  verifySignature(req) {
    throw new Error('PaymentProvider subclass must implement verifySignature(req)')
  }

  parse(req) {
    throw new Error('PaymentProvider subclass must implement parse(req)')
  }

  normalize(rawPayload) {
    throw new Error('PaymentProvider subclass must implement normalize(rawPayload)')
  }
}

module.exports = { PaymentProvider }
