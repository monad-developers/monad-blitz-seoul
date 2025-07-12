import { useState, useEffect } from 'react';

// 외부 검색 API 연동 커스텀 훅
export const useSearchAPI = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const search = async (query) => {
        setLoading(true);
        setError(null);
        
        try {
            // 외부 검색 API 호출 (예: Algolia)
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { searchResults, loading, error, search };
};
