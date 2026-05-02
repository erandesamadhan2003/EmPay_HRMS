import { useState } from 'react';
import { BASE_URL } from '../config/api';

export const useMutation = (method = 'POST') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (endpoint, body) => {
    setLoading(true);
    setError(null);
    const token = JSON.parse(
      localStorage.getItem('empay_auth') || '{}'
    )?.token;
    
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch(e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
