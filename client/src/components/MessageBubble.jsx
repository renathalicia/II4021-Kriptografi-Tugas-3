function MessageBubble({ message, isSent }) {
  let statusIcon = '';
  if (!message.decryptionSuccess) {
    statusIcon = '❌ ';
  } else if (message.macValid === false) {
    statusIcon = '⚠️ ';
  }

  //timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`message ${isSent ? 'sent' : 'received'} ${!message.decryptionSuccess ? 'error' : ''}`}>
      <div className="message-content">
        {statusIcon}{message.plaintext}
      </div>
      <div className="message-time">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

export default MessageBubble;