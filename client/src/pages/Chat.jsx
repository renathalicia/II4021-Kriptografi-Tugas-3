import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { importPublicKey, importPrivateKey, computeSharedSecret } from '../crypto/ecdh';
import { deriveAESKeyFromSharedSecret, exportAESKey, importAESKey } from '../crypto/hkdf';
import { encryptAES, decryptAES } from '../crypto/aes';
import { computeMAC, verifyMAC } from '../crypto/hmac';
import { usersAPI, messagesAPI, getJWTFromCookie } from '../services/api';
import './Chat.css';

function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contactEmail = searchParams.get('contact');

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatKey, setChatKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(0);

  useEffect(() => {
    if (!contactEmail) {
      navigate('/contacts');
      return;
    }

    const jwt = getJWTFromCookie();
    if (!jwt) {
      navigate('/login');
      return;
    }

    initializeChat();

    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [contactEmail, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Check if we already have chat key
      const storedKey = sessionStorage.getItem(`chatKey_${contactEmail}`);
      
      if (storedKey) {
        console.log('Using existing chat key');
        const key = await importAESKey(storedKey);
        setChatKey(key);
        
        // Load message history
        await loadMessages(key);

        // Start polling for new messages
        startMessagePolling(key);
      } else {
        console.log('Performing key exchange...');
        const key = await performKeyExchange();
        setChatKey(key);
        
        // Load message history
        await loadMessages(key);

        // Start polling for new messages
        startMessagePolling(key);
      }

      setLoading(false);
    } catch (err) {
      console.error('Chat initialization error:', err);
      setError(err.message || 'Gagal memulai chat');
      setLoading(false);
    }
  };

  const performKeyExchange = async () => {
    try {
      // Get contact's public key
      const { public_key: contactPublicKeyBase64 } = await usersAPI.getPublicKey(contactEmail);
      
      if (!contactPublicKeyBase64) {
        throw new Error('Public key kontak tidak ditemukan.');
      }
      
      const contactPublicKey = await importPublicKey(contactPublicKeyBase64);

      // Get our private key
      const myPrivateKeyBase64 = sessionStorage.getItem('privateKey');
      if (!myPrivateKeyBase64) {
        throw new Error('Private key tidak ditemukan. Silakan login kembali.');
      }
      const myPrivateKey = await importPrivateKey(myPrivateKeyBase64);

      // Compute shared secret
      const sharedSecret = await computeSharedSecret(myPrivateKey, contactPublicKey);

      // Derive AES key
      const myEmail = sessionStorage.getItem('email');
      const salt = [myEmail, contactEmail].sort().join(':');
      const aesKey = await deriveAESKeyFromSharedSecret(sharedSecret, salt);

      // Store for this session
      const exportedKey = await exportAESKey(aesKey);
      sessionStorage.setItem(`chatKey_${contactEmail}`, exportedKey);

      return aesKey;
    } catch (err) {
      console.error('Key exchange error:', err);
      throw err;
    }
  };

  const loadMessages = async (currentChatKey) => {
    try {
      const myEmail = sessionStorage.getItem('email');
      const encryptedMessages = await messagesAPI.getHistory(myEmail, contactEmail);

      const decryptedMessages = [];
      for (const msg of encryptedMessages) {
        const decrypted = await receiveMessage(msg, currentChatKey);
        decryptedMessages.push(decrypted);
      }

      setMessages(decryptedMessages);
      
      // Update lastMessageIdRef based on loaded messages
      if (decryptedMessages.length > 0) {
        lastMessageIdRef.current = decryptedMessages[decryptedMessages.length - 1].id;
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
  };

  const startMessagePolling = (currentChatKey) => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const myEmail = sessionStorage.getItem('email');
        const lastId = lastMessageIdRef.current;

        const newMessages = await messagesAPI.getNew(myEmail, contactEmail, lastId);

        if (newMessages && newMessages.length > 0) {
          const decryptedNewMessages = [];
          for (const msg of newMessages) {
            const decrypted = await receiveMessage(msg, currentChatKey);
            decryptedNewMessages.push(decrypted);
          }
          
          setMessages(prev => [...prev, ...decryptedNewMessages]);
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !chatKey) return;

    const plaintext = messageInput.trim();
    setMessageInput('');

    try {
      const myEmail = sessionStorage.getItem('email');

      // Encrypt message
      const { ciphertext, iv } = await encryptAES(plaintext, chatKey);

      // Compute MAC (BONUS)
      const mac = await computeMAC(ciphertext, chatKey);

      // Send to server
      const result = await messagesAPI.send(myEmail, contactEmail, ciphertext, iv, mac);
      const dbMessage = result.data;

      // Add to local messages
      const newMessage = {
        id: dbMessage.id,
        sender_email: myEmail,
        receiver_email: contactEmail,
        ciphertext,
        iv,
        mac,
        timestamp: dbMessage.timestamp || new Date().toISOString(),
        plaintext,
        isSent: true,
        decryptionSuccess: true,
        macValid: true
      };

      setMessages(prev => [...prev, newMessage]);
      lastMessageIdRef.current = newMessage.id;

    } catch (err) {
      console.error('Send message error:', err);
      setError('Gagal mengirim pesan');
      setTimeout(() => setError(''), 3000);
    }
  };

  const receiveMessage = async (encryptedMessage, currentChatKey) => {
    const myEmail = sessionStorage.getItem('email');
    const isSent = encryptedMessage.sender_email === myEmail;

    try {
      // Verify MAC (BONUS)
      const isValid = await verifyMAC(
        encryptedMessage.ciphertext,
        encryptedMessage.mac,
        currentChatKey
      );

      if (!isValid) {
        return {
          ...encryptedMessage,
          plaintext: '⚠️ PESAN TIDAK VALID (MAC mismatch)',
          isSent,
          decryptionSuccess: false,
          macValid: false
        };
      }

      // Decrypt message
      const plaintext = await decryptAES(
        encryptedMessage.ciphertext,
        encryptedMessage.iv,
        currentChatKey
      );

      return {
        ...encryptedMessage,
        plaintext,
        isSent,
        decryptionSuccess: true,
        macValid: true
      };

    } catch (err) {
      console.error('Decryption error:', err);
      return {
        ...encryptedMessage,
        plaintext: '❌ Gagal mendekripsi pesan',
        isSent,
        decryptionSuccess: false,
        macValid: false
      };
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <a href="/contacts" className="back-btn">← Kembali</a>
        <div className="chat-contact-info">
          <div className="contact-name">{contactEmail}</div>
          <div className="encryption-status">🔒 End-to-end encrypted</div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Mempersiapkan enkripsi...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="messages-container">
        {messages.map((msg, idx) => {
          let statusIcon = '';
          if (!msg.decryptionSuccess) {
            statusIcon = '❌ ';
          } else if (msg.macValid === false) {
            statusIcon = '⚠️ ';
          }

          return (
            <div
              key={idx}
              className={`message ${msg.isSent ? 'sent' : 'received'} ${
                !msg.decryptionSuccess ? 'error' : ''
              }`}
            >
              <div className="message-content">
                {statusIcon}{msg.plaintext}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan..."
          disabled={!chatKey}
        />
        <button
          onClick={sendMessage}
          className="btn btn-primary"
          disabled={!chatKey || !messageInput.trim()}
        >
          Kirim
        </button>
      </div>
    </div>
  );
}

export default Chat;
