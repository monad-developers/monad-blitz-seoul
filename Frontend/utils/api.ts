const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const uploadFile = async (file: File) => {
  try {
    // 폼 데이터 생성
    const formData = new FormData();
    formData.append('file', file);

    // 백엔드 API로 파일 업로드
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.fileUrl; // 백엔드에서 반환하는 S3 URL
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
};

export const createMusicProject = async (fileUrl: string, genre: string = "음악") => {
  try {
    const response = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        genre,
        deadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30일
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createMusicProject:', error);
    throw error;
  }
};