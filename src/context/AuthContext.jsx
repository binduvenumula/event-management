import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { unwrap } from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('vfstr_token'));

  // Restore the session on page load.
  useEffect(() => {
    if (!localStorage.getItem('vfstr_token')) return;
    api.get('/auth/me')
      .then((res) => setUser(unwrap(res)))
      .catch(() => localStorage.removeItem('vfstr_token'))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback((silent) => {
    localStorage.removeItem('vfstr_token');
    setUser(null);
    if (silent !== true) toast.success('Logged out');
    navigate('/login');
  }, [navigate]);

  // Token expired / invalid -> log out and go to login.
  useEffect(() => {
    const onExpired = (e) => {
      localStorage.removeItem('vfstr_token');
      setUser(null);
      toast.error(e.detail || 'Session expired. Please log in again.', { id: 'expired' });
      navigate('/login');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [navigate]);

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem('vfstr_token', token);
    setUser(u);
    return u;
  };

  const login = async (email, password) => saveSession(unwrap(await api.post('/auth/login', { email, password })));
  const signup = async (form) => saveSession(unwrap(await api.post('/auth/signup', form)));
  const refreshUser = async () => setUser(unwrap(await api.get('/auth/me')));

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
