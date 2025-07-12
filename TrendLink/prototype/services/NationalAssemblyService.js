/**
 * 국회의원 검색 API 서비스
 * 국회 OpenAPI를 통해 국회의원 정보를 검색합니다.
 */

class NationalAssemblyService {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api/assembly/search';
  }

  /**
   * 국회의원 검색
   * @param {string} memberName - 국회의원명 (선택사항)
   * @param {number} page - 페이지 번호 (기본값: 1)
   * @param {number} size - 페이지 당 결과 수 (기본값: 10)
   * @returns {Promise<Object>} 검색 결과
   */
  async searchMember(memberName = '', page = 1, size = 10) {
    try {
      const params = new URLSearchParams({
        page,
        size
      });

      // 국회의원명이 있으면 검색 조건 추가
      if (memberName && memberName.trim()) {
        params.append('memberName', memberName.trim());
      }

      const url = `${this.baseUrl}?${params.toString()}`;
      
      console.log('국회의원 검색 요청:', {
        url,
        memberName,
        page,
        size
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // API 응답 구조 확인
      console.log('국회의원 검색 응답:', data);

      return this.formatResponse(data);
    } catch (error) {
      console.error('국회의원 검색 실패:', error);
      throw error;
    }
  }

  /**
   * API 응답 데이터 포맷팅
   * @param {Object} data - 원본 API 응답
   * @returns {Object} 포맷된 응답
   */
  formatResponse(data) {
    try {
      console.log('원본 API 응답:', data);
      
      // 국회 OpenAPI 응답 구조 확인
      let members = [];
      
      // 다양한 가능한 구조 확인
      if (data.ALLNAMEMBER && Array.isArray(data.ALLNAMEMBER)) {
        console.log('ALLNAMEMBER 배열 발견:', data.ALLNAMEMBER);
        
        // 각 요소 확인
        for (let i = 0; i < data.ALLNAMEMBER.length; i++) {
          const item = data.ALLNAMEMBER[i];
          console.log(`ALLNAMEMBER[${i}]:`, item);
          
          if (item && item.row && Array.isArray(item.row)) {
            console.log(`row 배열 발견 [${i}]:`, item.row);
            members = members.concat(item.row);
          } else if (item && typeof item === 'object') {
            // row 배열이 없으면 item 자체가 데이터일 수 있음
            members.push(item);
          }
        }
      } else if (data.ALLNAMEMBER && data.ALLNAMEMBER.row) {
        // 단일 객체인 경우
        console.log('단일 ALLNAMEMBER 객체:', data.ALLNAMEMBER);
        members = data.ALLNAMEMBER.row;
      } else {
        console.log('예상과 다른 응답 구조:', Object.keys(data));
      }
      
      console.log('최종 추출된 멤버 데이터:', members);
      
      if (!Array.isArray(members)) {
        members = [];
      }
      
      const formattedMembers = members.map(member => {
        console.log('개별 멤버 데이터:', member);
        
        return {
          // 기본 정보
          code: member.NAAS_CD,
          name: member.NAAS_NM,
          chineseName: member.NAAS_CH_NM,
          englishName: member.NAAS_EN_NM,
          
          // 개인 정보
          birthday: member.BIRDY_DT,
          gender: member.NTR_DIV,
          
          // 정치 정보
          position: member.DTY_NM,
          party: member.PLPT_NM,
          constituency: member.ELECD_NM,
          constituencyType: member.ELECD_DIV_NM,
          reelection: member.RLCT_DIV_NM,
          termNumber: member.GTELT_ERACO,
          
          // 위원회 정보
          committee: member.CMIT_NM,
          belongingCommittee: member.BLNG_CMIT_NM,
          
          // 연락처 정보
          phoneNumber: member.NAAS_TEL_NO,
          email: member.NAAS_EMAIL_ADDR,
          homepage: member.NAAS_HP_URL,
          
          // 사무실 정보
          officeRoom: member.OFFM_RNUM_NO,
          
          // 보좌진 정보
          aide: member.AIDE_NM,
          chiefSecretary: member.CHF_SCRT_NM,
          secretary: member.SCRT_NM,
          
          // 기타 정보
          profile: member.BRF_HST,
          photo: member.NAAS_PIC
        };
      });

      console.log('최종 포맷된 멤버 데이터:', formattedMembers);

      return {
        success: true,
        data: formattedMembers,
        total: formattedMembers.length,
        page: 1,
        size: formattedMembers.length
      };
    } catch (error) {
      console.error('응답 포맷팅 실패:', error);
      console.error('원본 데이터:', data);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * 전체 국회의원 목록 조회
   * @returns {Promise<Object>} 전체 국회의원 목록
   */
  async getAllMembers() {
    return this.searchMember('', 1, 100);
  }

  /**
   * 정당별 국회의원 검색
   * @param {string} partyName - 정당명
   * @returns {Promise<Object>} 정당별 국회의원 목록
   */
  async searchByParty(partyName) {
    const allMembers = await this.getAllMembers();
    
    if (!allMembers.success) {
      return allMembers;
    }

    const filteredMembers = allMembers.data.filter(member => 
      member.party && member.party.includes(partyName)
    );

    return {
      success: true,
      data: filteredMembers,
      total: filteredMembers.length,
      query: partyName,
      type: 'party'
    };
  }

  /**
   * 선거구별 국회의원 검색
   * @param {string} constituency - 선거구명
   * @returns {Promise<Object>} 선거구별 국회의원 목록
   */
  async searchByConstituency(constituency) {
    const allMembers = await this.getAllMembers();
    
    if (!allMembers.success) {
      return allMembers;
    }

    const filteredMembers = allMembers.data.filter(member => 
      member.constituency && member.constituency.includes(constituency)
    );

    return {
      success: true,
      data: filteredMembers,
      total: filteredMembers.length,
      query: constituency,
      type: 'constituency'
    };
  }
}

export default NationalAssemblyService;
