import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, authAPI, getJWTFromCookie } from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import './Contacts.css';

function Contacts() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    try {
      setLoading(true);
      const result = await usersAPI.getAll();
      
      const emailList = result.contacts || [];
      
      const formattedContacts = emailList.map(email => ({ email }));
      
      setContacts(formattedContacts);
    } catch (err) {
      console.error('Load contacts error:', err);
      if (err.message.includes('401')) {
        authAPI.logout();
        navigate('/login');
      } else {
        setError(err.message || 'Gagal memuat kontak');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const jwt = getJWTFromCookie();
    const privateKey = sessionStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    if (!jwt || !privateKey) {
      navigate('/login');
      return;
    }

    loadContacts();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openChat = (contactEmail) => {
    navigate(`/chat?contact=${encodeURIComponent(contactEmail)}`);
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h1>Daftar Kontak</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {loading && <div className="alert alert-info">Memuat kontak...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="contacts-list">
        {contacts.length === 0 && !loading && (
          <p className="no-contacts">Belum ada kontak lain</p>
        )}

        {contacts.map((contact) => {
          const firstLetter = contact.email.charAt(0).toUpperCase();
          return (
            <div
              key={contact.email}
              className="contact-item"
              onClick={() => openChat(contact.email)}
            >
              <div className="contact-avatar">{firstLetter}</div>
              <div className="contact-info">
                <div className="contact-email">{contact.email}</div>
              </div>
              <div className="contact-arrow">→</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Contacts;
