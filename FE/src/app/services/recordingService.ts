import api from './api';

export interface Recording {
  id: string;
  bookingId: string;
  courseCode: string;
  uploaderName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export async function uploadRecording(bookingId: string, blob: Blob): Promise<Recording> {
  const form = new FormData();
  form.append('bookingId', bookingId);
  form.append('file', blob, `session-${bookingId}.webm`);
  const { data } = await api.post('/api/recordings', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data as Recording;
}

export async function listRecordings(): Promise<Recording[]> {
  const { data } = await api.get('/api/admin/recordings');
  return data.data as Recording[];
}

export async function downloadRecording(id: string): Promise<Blob> {
  const { data } = await api.get(`/api/recordings/${id}/file`, { responseType: 'blob' });
  return data as Blob;
}
