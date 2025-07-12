import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 네이버 API 키
const CLIENT_ID = 'qLba1KCz4zla91Plq8xr';
const CLIENT_SECRET = '3WvVPoz_OF';

// 국회의원 API 키
const ASSEMBLY_API_KEY = 'f166c9a9fe8c4a3b991509332838a5f1';

// 네이버 검색 프록시 엔드포인트
app.get('/api/naver/search/:type', async (req, res) => {
    const { type } = req.params;
    const { query, display = 10, start = 1 } = req.query;

    if (!query) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    try {
        let apiUrl = '';
        
        switch (type) {
            case 'blog':
                apiUrl = `https://openapi.naver.com/v1/search/blog.json`;
                break;
            case 'news':
                apiUrl = `https://openapi.naver.com/v1/search/news.json`;
                break;
            case 'webkr':
                apiUrl = `https://openapi.naver.com/v1/search/webkr.json`;
                break;
            case 'image':
                apiUrl = `https://openapi.naver.com/v1/search/image.json`;
                break;
            case 'shop':
                apiUrl = `https://openapi.naver.com/v1/search/shop.json`;
                break;
            default:
                return res.status(400).json({ error: '지원하지 않는 검색 타입입니다.' });
        }

        const response = await fetch(
            `${apiUrl}?query=${encodeURIComponent(query)}&display=${display}&start=${start}`,
            {
                headers: {
                    'X-Naver-Client-Id': CLIENT_ID,
                    'X-Naver-Client-Secret': CLIENT_SECRET
                }
            }
        );

        if (!response.ok) {
            throw new Error(`네이버 API 오류: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('네이버 검색 API 오류:', error);
        res.status(500).json({ 
            error: '검색 중 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

// 통합 검색 엔드포인트
app.get('/api/naver/integrated', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    try {
        const [blogData, newsData, webData] = await Promise.all([
            fetch(`https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=5`, {
                headers: {
                    'X-Naver-Client-Id': CLIENT_ID,
                    'X-Naver-Client-Secret': CLIENT_SECRET
                }
            }).then(res => res.json()),
            fetch(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=3`, {
                headers: {
                    'X-Naver-Client-Id': CLIENT_ID,
                    'X-Naver-Client-Secret': CLIENT_SECRET
                }
            }).then(res => res.json()),
            fetch(`https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=2`, {
                headers: {
                    'X-Naver-Client-Id': CLIENT_ID,
                    'X-Naver-Client-Secret': CLIENT_SECRET
                }
            }).then(res => res.json())
        ]);

        const integratedResults = {
            blog: blogData.items || [],
            news: newsData.items || [],
            web: webData.items || []
        };

        res.json(integratedResults);

    } catch (error) {
        console.error('통합 검색 오류:', error);
        res.status(500).json({ 
            error: '통합 검색 중 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

// 국회의원 검색 프록시 엔드포인트
app.get('/api/assembly/search', async (req, res) => {
    const { memberName, page = 1, size = 10 } = req.query;

    try {
        const params = new URLSearchParams({
            Key: ASSEMBLY_API_KEY,
            Type: 'json',
            pIndex: page,
            pSize: size
        });

        // 국회의원명이 있으면 검색 조건 추가
        if (memberName && memberName.trim()) {
            params.append('NAAS_NM', memberName.trim());
        }

        const apiUrl = `https://open.assembly.go.kr/portal/openapi/ALLNAMEMBER?${params.toString()}`;
        
        console.log('국회의원 검색 요청:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'TrendLink/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log('국회의원 검색 응답:', data);
        
        res.json(data);

    } catch (error) {
        console.error('국회의원 검색 오류:', error);
        res.status(500).json({ 
            error: '국회의원 검색 중 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`네이버 검색 프록시 서버가 포트 ${PORT}에서 실행중입니다.`);
});

export default app;
