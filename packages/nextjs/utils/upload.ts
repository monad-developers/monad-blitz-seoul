/**
 * 백엔드에 파일을 업로드하는 함수
 */
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://monad.newjeans.cloud/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 단일 파일 업로드 응답
    if (result.url) {
      // uploads 경로를 static으로 변경
      const correctedUrl = result.url.replace('/uploads/', '/static/');
      return correctedUrl;
    }
    
    // 다중 파일 업로드 응답
    if (result.urls && result.urls.length > 0) {
      // uploads 경로를 static으로 변경
      const correctedUrl = result.urls[0].replace('/uploads/', '/static/');
      return correctedUrl;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * 여러 파일을 업로드하는 함수
 */
export const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('file', file);
  });

  try {
    const response = await fetch('https://monad.newjeans.cloud/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 다중 파일 업로드 응답
    if (result.urls) {
      // uploads 경로를 static으로 변경
      const correctedUrls = result.urls.map((url: string) => url.replace('/uploads/', '/static/'));
      return correctedUrls;
    }
    
    // 단일 파일 업로드 응답을 배열로 변환
    if (result.url) {
      // uploads 경로를 static으로 변경
      const correctedUrl = result.url.replace('/uploads/', '/static/');
      return [correctedUrl];
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Multiple files upload error:', error);
    throw error;
  }
};