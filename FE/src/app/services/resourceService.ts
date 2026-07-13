import api from './api';
import type { Resource } from '../data/mockData';

export async function listResources(): Promise<Resource[]> {
  const { data } = await api.get('/api/resources');
  return data.data as Resource[];
}
