import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/api';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login({ username, password });
      login(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-icon">
            <ShieldCheck size={32} />
          </div>
          <h1>STS Portal</h1>
          <p>Teacher Attendance & Performance</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-badge">{error}</div>}
          
          <div className="input-group">
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Logging in...' : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <div className="demo-hints">
          <p>Demo accounts:</p>
          <ul>
            <li><strong>Admin:</strong> admin / admin123</li>
            <li><strong>Teacher:</strong> teacher1 / pass123</li>
            <li><strong>Head Teacher:</strong> headteacher / pass123</li>
            <li><strong>Accountant:</strong> accountant / pass123</li>
          </ul>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(-45deg, #4f46e5, #312e81, #7c3aed, #4338ca);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          padding: 1.5rem;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .login-header { text-align: center; margin-bottom: 2rem; }
        .logo-icon { 
          width: 64px; height: 64px; background: #eef2ff; color: #4f46e5;
          border-radius: 1rem; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
        }
        .login-header h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .login-header p { color: #64748b; font-size: 0.875rem; }

        .password-wrapper { position: relative; }
        .toggle-password {
          position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #94a3b8; cursor: pointer;
        }

        .login-btn { width: 100%; margin-top: 1rem; height: 3.5rem; }

        .error-badge {
          background: #fee2e2; color: #991b1b; padding: 0.75rem; border-radius: 0.75rem;
          font-size: 0.875rem; margin-bottom: 1rem; text-align: center; border: 1px solid #fecaca;
        }

        .demo-hints {
          margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
          font-size: 0.75rem; color: #64748b;
        }
        .demo-hints ul { list-style: none; margin-top: 0.5rem; }
        .demo-hints li { margin-bottom: 0.25rem; }
        .demo-hints strong { color: #475569; }
      `}} />
    </div>
  );
};

export default Login;
