import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useLostFound = ({ type, category, search, status } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const res = await api.get(`lost-found/?${params.toString()}`);
      setItems(res.data);
      setError(null);
    } catch {
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [type, category, search, status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const reportItem = async (formData) => {
    const hasImage = formData.image instanceof File;

    let res;
    if (hasImage) {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) fd.append(key, value);
      });
      // Let axios set the multipart boundary automatically
      res = await api.post('lost-found/', fd);
    } else {
      const { image, ...jsonData } = formData;
      res = await api.post('lost-found/', jsonData);
    }

    setItems(prev => [res.data, ...prev]); // prepend new item
    return res.data;
  };

  const updateStatus = async (id, status) => {
    const res = await api.patch(`lost-found/${id}/status/`, { status });
    setItems(prev => prev.map(item => (item.id === id ? res.data : item)));
    return res.data;
  };

  const claimItem = async (id) => {
    const res = await api.patch(`lost-found/${id}/claim/`);
    setItems(prev => prev.map(item => (item.id === id ? res.data : item)));
    return res.data;
  };

  const resolveItem = async (id) => {
    const res = await api.post(`lost-found/${id}/resolve/`);
    setItems(prev => prev.map(item => (item.id === id ? res.data : item)));
    return res.data;
  };

  return { items, loading, error, fetchItems, reportItem, updateStatus, claimItem, resolveItem };
};
