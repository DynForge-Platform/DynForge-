import api from './api';

export interface StatItem {
  icon: string;
  value: string;
  labelVi: string;
  labelEn: string;
}

export interface AdPlanItem {
  id: string;
  name: string;
  monthlyPrice: number | null;
  yearlyDiscountPercent: number;
  color: string;
  badgeVi: string | null;
  badgeEn: string | null;
  badgeColor: string;
  descriptionVi: string;
  descriptionEn: string;
  featuresVi: string[];
  featuresEn: string[];
  highlight: boolean;
  active: boolean;
}

export interface PartnershipConfig {
  id: string;
  stats: StatItem[];
  plans: AdPlanItem[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface PartnershipLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  goals?: string;
  planName?: string;
  billingCycle?: string;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSubmission {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  goals?: string;
  planName?: string;
  billingCycle?: string;
}

/** Lấy cấu hình quảng cáo & bảng giá (Public) */
export async function getPartnershipConfig(): Promise<PartnershipConfig> {
  const { data } = await api.get('/api/partnerships/config');
  return data.data as PartnershipConfig;
}

/** Gửi form đăng ký hợp tác từ doanh nghiệp (Public) */
export async function submitPartnershipLead(payload: LeadSubmission): Promise<PartnershipLead> {
  const { data } = await api.post('/api/partnerships/leads', payload);
  return data.data as PartnershipLead;
}

/** [ADMIN] Lấy cấu hình bảng giá */
export async function getAdminPartnershipConfig(): Promise<PartnershipConfig> {
  const { data } = await api.get('/api/admin/partnerships/config');
  return data.data as PartnershipConfig;
}

/** [ADMIN] Cập nhật bảng giá & thống kê */
export async function updateAdminPartnershipConfig(config: PartnershipConfig): Promise<PartnershipConfig> {
  const { data } = await api.put('/api/admin/partnerships/config', config);
  return data.data as PartnershipConfig;
}

/** [ADMIN] Lấy danh sách doanh nghiệp đăng ký */
export async function listPartnershipLeads(status?: string): Promise<PartnershipLead[]> {
  const params = status && status !== 'ALL' ? { status } : {};
  const { data } = await api.get('/api/admin/partnerships/leads', { params });
  return data.data as PartnershipLead[];
}

/** [ADMIN] Cập nhật trạng thái xử lý đơn liên hệ */
export async function updateLeadStatus(id: string, status: string, adminNote?: string): Promise<PartnershipLead> {
  const { data } = await api.patch(`/api/admin/partnerships/leads/${id}/status`, { status, adminNote });
  return data.data as PartnershipLead;
}

/** [ADMIN] Xóa đơn liên hệ */
export async function deleteLead(id: string): Promise<void> {
  await api.delete(`/api/admin/partnerships/leads/${id}`);
}
