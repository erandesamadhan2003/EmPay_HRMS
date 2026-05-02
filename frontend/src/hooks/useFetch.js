import { useState, useCallback, useEffect } from 'react';
import { BASE_URL } from '../config/api';

export const useFetch = (endpoint, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const token = JSON.parse(
      localStorage.getItem('empay_auth') || '{}'
    )?.token;
    
    fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
  }, [endpoint, ...deps]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
};
