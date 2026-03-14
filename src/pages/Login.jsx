import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Cookies from 'js-cookie';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic phone number validation
    if (!/^\d+$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const formattedPhoneNumber = phoneNumber.replace(/(\+\d{1,3})(\d{9,10})/, '$1 $2');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Cookies.set('phoneNumber', phoneNumber, { expires: 3 }); // Save phone number to cookie
        login(phoneNumber); // Store phone number upon successful login
        navigate('/account')
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-cream-50">
      <div >
        <h2 className="text-2xl font-semibold mb-4">Login with Phone Number</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
            <input type="tel" id="phoneNumber" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter your phone number with country code (e.g., +11234567890)" />
          </div>
          <div className="flex items-center justify-between">
            <button disabled={loading} className="bg-navy-700 hover:bg-navy-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
