"use client";
import { useEffect, useState } from 'react';

function MezonLoginButton() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };
  return (
    <button
      onClick={handleLogin}
      style={{
        padding: '8px 16px',
        fontSize: 16,
        marginTop: 16,
        background: 'linear-gradient(90deg, #a259ff 0%, #6a11cb 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 2px 8px #a259ff33',
        transition: 'background 0.2s',
      }}
    >
      Login with Mezon
    </button>
  );
}

function MezonLogoutButton({ onLogout }: { onLogout: () => void }) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    onLogout();
  };
  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        fontSize: 16,
        marginTop: 16,
        background: 'linear-gradient(90deg, #a259ff 0%, #6a11cb 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 2px 8px #a259ff33',
        transition: 'background 0.2s',
      }}
    >
      Logout
    </button>
  );
}

export default function UserPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/user')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data && !data.error ? data : null);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/user';
  };

  return (
    <main style={{ padding: 32 }}>
      <h1>User Info</h1>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>User Info:</strong>
            <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6 }}>{JSON.stringify(user, null, 2)}</pre>
          </div>
          <MezonLogoutButton onLogout={handleLogout} />
        </>
      ) : (
        <MezonLoginButton />
      )}
    </main>
  );
}
