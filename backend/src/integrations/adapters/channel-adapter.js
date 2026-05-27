class ChannelAdapter {
  constructor(config = {}) {
    this.name = config.name || 'base'
    this.channel = config.channel || 'unknown'
    this.enabled = config.enabled !== false
    this.logger = config.logger || console
  }

  async send(payload) {
    throw new Error(`ChannelAdapter.send() not implemented for channel: ${this.channel}`)
  }

  async getStatus(messageId) {
    throw new Error(`ChannelAdapter.getStatus() not implemented for channel: ${this.channel}`)
  }

  async validateConfig(config) {
    throw new Error(`ChannelAdapter.validateConfig() not implemented for channel: ${this.channel}`)
  }

  isAvailable() {
    return this.enabled
  }

  getInfo() {
    return {
      name: this.name,
      channel: this.channel,
      enabled: this.enabled
    }
  }
}

module.exports = ChannelAdapter
