// 네이버 검색 API 연동 서비스 (프록시 서버 사용)
class NaverSearchService {
    constructor() {
        this.proxyUrl = 'http://localhost:3001/api/naver';
    }

    // 네이버 블로그 검색
    async searchAll(query, display = 10, start = 1) {
        try {
            const response = await fetch(`${this.proxyUrl}/search/blog?query=${encodeURIComponent(query)}&display=${display}&start=${start}`);
            
            if (!response.ok) {
                throw new Error(`네이버 API 오류: ${response.status}`);
            }

            const data = await response.json();
            return this.formatResults(data.items || [], 'blog');
        } catch (error) {
            console.error('네이버 블로그 검색 API 오류:', error);
            // 네이버 API 실패 시 모의 데이터 반환
            return this.getMockResults(query, 'blog');
        }
    }

    // 네이버 뉴스 검색
    async searchNews(query, display = 10, start = 1) {
        try {
            const response = await fetch(`${this.proxyUrl}/search/news?query=${encodeURIComponent(query)}&display=${display}&start=${start}`);
            
            if (!response.ok) {
                throw new Error(`네이버 뉴스 API 오류: ${response.status}`);
            }

            const data = await response.json();
            return this.formatResults(data.items || [], 'news');
        } catch (error) {
            console.error('네이버 뉴스 검색 API 오류:', error);
            return this.getMockResults(query, 'news');
        }
    }

    // 네이버 웹 검색
    async searchWeb(query, display = 10, start = 1) {
        try {
            const response = await fetch(`${this.proxyUrl}/search/webkr?query=${encodeURIComponent(query)}&display=${display}&start=${start}`);
            
            if (!response.ok) {
                throw new Error(`네이버 웹 검색 API 오류: ${response.status}`);
            }

            const data = await response.json();
            return this.formatResults(data.items || [], 'web');
        } catch (error) {
            console.error('네이버 웹 검색 API 오류:', error);
            return this.getMockResults(query, 'web');
        }
    }

    // 통합 검색 (여러 카테고리 결합)
    async searchIntegrated(query) {
        try {
            const response = await fetch(`${this.proxyUrl}/integrated?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`통합 검색 API 오류: ${response.status}`);
            }

            const data = await response.json();
            
            const results = [
                ...this.formatResults(data.blog || [], 'blog'),
                ...this.formatResults(data.news || [], 'news'),
                ...this.formatResults(data.web || [], 'web')
            ];

            return results;
        } catch (error) {
            console.error('통합 검색 오류:', error);
            return this.getMockResults(query);
        }
    }

    // 검색 결과 포맷팅
    formatResults(items, type) {
        return items.map((item, index) => ({
            id: `${type}_${index}`,
            title: this.stripHtml(item.title),
            description: this.stripHtml(item.description),
            url: item.link,
            type: type,
            pubDate: item.pubDate || new Date().toISOString(),
            bloggerName: item.bloggerName || '',
            category: type === 'news' ? '뉴스' : type === 'blog' ? '블로그' : '웹'
        }));
    }

    // HTML 태그 제거
    stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    }

    // 모의 데이터 (API 실패 시 사용)
    getMockResults(query, type = 'mixed') {
        const mockData = [
            {
                id: 1,
                title: `${query} - 네이버 블로그`,
                description: `${query}에 대한 상세한 블로그 포스팅입니다. 최신 정보와 유용한 팁을 제공합니다.`,
                url: 'https://blog.naver.com',
                type: 'blog',
                category: '블로그'
            },
            {
                id: 2,
                title: `${query} 관련 뉴스`,
                description: `${query}와 관련된 최신 뉴스 기사입니다. 업계 동향과 분석을 확인하세요.`,
                url: 'https://news.naver.com',
                type: 'news',
                category: '뉴스'
            },
            {
                id: 3,
                title: `${query} 완벽 가이드`,
                description: `${query} 초보자를 위한 완벽한 가이드입니다. 단계별로 쉽게 설명합니다.`,
                url: 'https://search.naver.com',
                type: 'web',
                category: '웹'
            },
            {
                id: 4,
                title: `${query} 커뮤니티 토론`,
                description: `${query}에 관심있는 사람들과 소통하고 정보를 공유하세요.`,
                url: 'https://cafe.naver.com',
                type: 'cafe',
                category: '카페'
            },
            {
                id: 5,
                title: `${query} 추천 및 리뷰`,
                description: `${query} 관련 제품과 서비스에 대한 실제 사용자 리뷰와 추천을 확인하세요.`,
                url: 'https://shopping.naver.com',
                type: 'shopping',
                category: '쇼핑'
            }
        ];

        return mockData;
    }
}

export default NaverSearchService;
