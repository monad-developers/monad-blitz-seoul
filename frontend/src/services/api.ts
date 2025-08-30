import axios from 'axios';

// Nginx 프록시 기준 API 엔드포인트
const API_BASE_URL = '/api';

// 타입 정의
export interface User {
  id: number;
  email: string;
  wallet_address?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 회원가입
export async function register(email: string, password: string, wallet_address?: string) {
  const res = await axios.post(`${API_BASE_URL}/register`, { email, password, wallet_address });
  return res.data;
}

// 로그인
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await axios.post(`${API_BASE_URL}/login`, { email, password });
  return res.data;
}

// 이벤트 생성 (form-data, csv 파일 업로드)
export async function createEvent(token: string, data: {
  name: string;
  start_at: string;
  end_at: string;
  participant_cap?: number;
  csvFile?: File;
}) {
  const form = new FormData();
  form.append('name', data.name);
  form.append('start_at', data.start_at);
  form.append('end_at', data.end_at);
  if (data.participant_cap) form.append('participant_cap', String(data.participant_cap));
  if (data.csvFile) form.append('csv', data.csvFile);
  const res = await axios.post(`${API_BASE_URL}/events`, form, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// 내 이벤트 목록 조회
export async function getMyEvents(token: string) {
  const res = await axios.get(`${API_BASE_URL}/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// 경품 등록 (form-data, 이미지 업로드)
export async function createPrize(token: string, data: {
  event_id: number;
  name: string;
  winners_count: number;
  description?: string;
  imageFile?: File;
}) {
  const form = new FormData();
  form.append('event_id', String(data.event_id));
  form.append('name', data.name);
  form.append('winners_count', String(data.winners_count));
  if (data.description) form.append('description', data.description);
  if (data.imageFile) form.append('image', data.imageFile);
  const res = await axios.post(`${API_BASE_URL}/prizes`, form, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// 경품 목록 조회
export async function getPrizes(token: string, event_id: number) {
  const res = await axios.get(`${API_BASE_URL}/prizes`, {
    params: { event_id },
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// 이벤트 QR코드 이미지 URL 반환
export function getEventQrUrl(event_id: number) {
  return `${API_BASE_URL}/events/${event_id}/qr`;
}

// 이벤트 CSV 헤더 필드명 조회
export async function getEventCsvFields(token: string, eventId: number) {
  const res = await axios.get(`${API_BASE_URL}/events/${eventId}/csv-fields`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.fields;
}
