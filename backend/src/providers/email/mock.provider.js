const sentMessages = [];

function createMockProvider() {
  return {
    name: 'mock',
    async send(message) {
      if (process.env.MOCK_EMAIL_FAIL === 'true') {
        throw new Error('Falha simulada de email');
      }

      const storedMessage = {
        ...message,
        messageId: `mock-${sentMessages.length + 1}`
      };

      sentMessages.push(storedMessage);

      return {
        provider: 'mock',
        messageId: storedMessage.messageId
      };
    }
  };
}

createMockProvider.sentMessages = sentMessages;
createMockProvider.clear = () => {
  sentMessages.splice(0, sentMessages.length);
};

module.exports = createMockProvider;
