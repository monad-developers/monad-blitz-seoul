/**
 * Gemini API를 사용하여 PDF 파일을 요약하는 함수
 */

export interface SummaryResult {
  summary: string;
  keySkills: string[];
  experience: string;
  education: string;
  achievements: string[];
}

/**
 * PDF 파일을 Gemini API로 요약
 */
export const summarizePDFWithGemini = async (pdfUrl: string): Promise<SummaryResult> => {
  try {
    console.log('Starting PDF summarization with Gemini API...');
    console.log('PDF URL:', pdfUrl);
    
    // 환경변수에서 API 키 가져오기
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('API Key available:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    // PDF 파일을 base64로 변환
    console.log('Fetching PDF file from URL...');
    const response = await fetch(pdfUrl);
    console.log('PDF fetch response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF file: ${response.status} ${response.statusText}`);
    }
    
    console.log('Converting PDF to base64...');
    const arrayBuffer = await response.arrayBuffer();
    console.log('Array buffer size:', arrayBuffer.byteLength);
    
    // 브라우저 환경에서 Base64 변환
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    const base64String = btoa(binaryString);
    console.log('Base64 string length:', base64String.length);

    // Gemini API 요청 - 최신 모델 사용
    console.log('Sending request to Gemini API...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `다음 PDF 이력서를 분석하여 한국어로 요약해주세요. 다음 형식의 JSON으로 응답해주세요:

{
  "summary": "전체적인 요약 (2-3문장, 100자 내외)",
  "keySkills": ["주요 기술 스킬들"],
  "experience": "경력 요약 (주요 경력사항)",
  "education": "학력 정보",
  "achievements": ["주요 성과나 프로젝트들"]
}

명판 뒷면에 들어갈 간결하고 임팩트 있는 소개글로 작성해주세요.`
              },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64String
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    console.log('Gemini API response status:', geminiResponse.status);
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`);
    }

    console.log('Parsing Gemini API response...');
    const geminiData = await geminiResponse.json();
    console.log('Gemini API response:', geminiData);
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const content = geminiData.candidates[0].content.parts[0].text;
    
    // JSON 파싱 시도
    try {
      // JSON 블록에서 실제 JSON만 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // 기본값 설정
      return {
        summary: parsedResult.summary || '이력서 요약을 생성할 수 없습니다.',
        keySkills: Array.isArray(parsedResult.keySkills) ? parsedResult.keySkills : [],
        experience: parsedResult.experience || '',
        education: parsedResult.education || '',
        achievements: Array.isArray(parsedResult.achievements) ? parsedResult.achievements : []
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      
      // JSON 파싱 실패 시 텍스트에서 정보 추출
      return {
        summary: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        keySkills: [],
        experience: '',
        education: '',
        achievements: []
      };
    }

  } catch (error) {
    console.error('Error summarizing PDF with Gemini:', error);
    throw error;
  }
};

/**
 * 요약 결과를 명판용 텍스트로 변환
 */
export const formatSummaryForCard = (summary: SummaryResult): string => {
  let cardText = summary.summary;
  
  if (summary.experience) {
    cardText += `\n\n${summary.experience}`;
  }
  
  if (summary.keySkills.length > 0) {
    cardText += `\n\n주요 기술: ${summary.keySkills.slice(0, 5).join(', ')}`;
  }
  
  if (summary.achievements.length > 0) {
    cardText += `\n\n${summary.achievements[0]}`;
  }
  
  return cardText;
};