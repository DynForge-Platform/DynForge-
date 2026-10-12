import { useState, useEffect } from 'react';
import {
  Megaphone, DollarSign, Users, CheckCircle, Clock, Trash2,
  Save, Plus, X, Phone, Mail, Building, Eye, RefreshCw,
  TrendingUp, BarChart3, Star, ShieldCheck, Tag, FileText,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatDateTime } from '../../lib/format';
import {
  getAdminPartnershipConfig,
  updateAdminPartnershipConfig,
  listPartnershipLeads,
  updateLeadStatus,
  deleteLead,
  type PartnershipConfig,
  type PartnershipLead,
  type AdPlanItem,
} from '../../services/partnershipService';

export function AdminPartnership() {
  const { lang } = useLanguage();
  const vi = lang === 'vi';

  const [activeTab, setActiveTab] = useState<'plans' | 'leads'>('plans');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config state
  const [config, setConfig] = useState<PartnershipConfig | null>(null);

  // Leads state
  const [leads, setLeads] = useState<PartnershipLead[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Load config & leads
  const loadData = async () => {
    try {
      setLoading(true);
      const [cfg, lds] = await Promise.all([
        getAdminPartnershipConfig(),
        listPartnershipLeads(),
      ]);
      setConfig(cfg);
      setLeads(lds);
    } catch (err: any) {
      toast.error(vi ? 'Không thể tải dữ liệu cấu hình quảng cáo.' : 'Failed to load partnership data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const updated = await updateAdminPartnershipConfig(config);
      setConfig(updated);
      toast.success(vi ? 'Đã lưu cấu hình bảng giá và quảng cáo thành công!' : 'Partnership pricing configuration saved successfully!');
    } catch (err: any) {
      toast.error(vi ? 'Lưu cấu hình thất bại.' : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const updated = await updateLeadStatus(leadId, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.success(vi ? 'Đã cập nhật trạng thái đơn liên hệ.' : 'Lead status updated.');
    } catch {
      toast.error(vi ? 'Cập nhật thất bại.' : 'Update failed.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm(vi ? 'Bạn có chắc chắn muốn xóa đơn liên hệ này?' : 'Are you sure you want to delete this lead?')) {
      return;
    }
    try {
      await deleteLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success(vi ? 'Đã xóa đơn liên hệ.' : 'Lead deleted.');
    } catch {
      toast.error(vi ? 'Xóa thất bại.' : 'Delete failed.');
    }
  };

  // Helper updates for plans
  const updatePlan = (idx: number, patch: Partial<AdPlanItem>) => {
    if (!config) return;
    const newPlans = [...config.plans];
    newPlans[idx] = { ...newPlans[idx], ...patch };
    setConfig({ ...config, plans: newPlans });
  };

  const addFeature = (planIdx: number) => {
    if (!config) return;
    const plan = config.plans[planIdx];
    const newVi = [...(plan.featuresVi || []), 'Tính năng mới'];
    const newEn = [...(plan.featuresEn || []), 'New feature'];
    updatePlan(planIdx, { featuresVi: newVi, featuresEn: newEn });
  };

  const removeFeature = (planIdx: number, fIdx: number) => {
    if (!config) return;
    const plan = config.plans[planIdx];
    const newVi = plan.featuresVi.filter((_, i) => i !== fIdx);
    const newEn = plan.featuresEn.filter((_, i) => i !== fIdx);
    updatePlan(planIdx, { featuresVi: newVi, featuresEn: newEn });
  };

  const updateFeatureText = (planIdx: number, fIdx: number, val: string, isVi: boolean) => {
    if (!config) return;
    const plan = config.plans[planIdx];
    if (isVi) {
      const newVi = [...plan.featuresVi];
      newVi[fIdx] = val;
      updatePlan(planIdx, { featuresVi: newVi });
    } else {
      const newEn = [...plan.featuresEn];
      newEn[fIdx] = val;
      updatePlan(planIdx, { featuresEn: newEn });
    }
  };

  // Helper updates for stats
  const updateStat = (idx: number, patch: Partial<typeof config.stats[0]>) => {
    if (!config) return;
    const newStats = [...config.stats];
    newStats[idx] = { ...newStats[idx], ...patch };
    setConfig({ ...config, stats: newStats });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <RefreshCw className="mr-2 size-5 animate-spin text-cyan-400" />
        {vi ? 'Đang tải cấu hình quảng cáo...' : 'Loading partnership settings...'}
      </div>
    );
  }

  const pendingCount = leads.filter((l) => l.status === 'PENDING').length;
  const filteredLeads = statusFilter === 'ALL'
    ? leads
    : leads.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="size-6 text-cyan-400" />
            {vi ? 'Quản Lý Quảng Cáo & Đối Tác' : 'Ad & Partnership Management'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {vi
              ? 'Tùy chỉnh bảng giá, gói cước quảng cáo hiển thị ở Footer và quản lý danh sách doanh nghiệp đăng ký hợp tác.'
              : 'Customize pricing tiers, banner stats, and manage incoming corporate partnership inquiries.'}
          </p>
        </div>

        {activeTab === 'plans' && (
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            {vi ? 'Lưu Cấu Hình Bảng Giá' : 'Save Pricing Config'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'plans'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="size-4" />
          {vi ? 'Cấu hình Gói Cước & Thống Kê' : 'Pricing Plans & Stats'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'leads'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="size-4" />
          {vi ? 'Đơn Đăng Ký Hợp Tác' : 'Partnership Inquiries'}
          {pendingCount > 0 && (
            <Badge className="ml-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-1.5 py-0">
              {pendingCount} {vi ? 'mới' : 'new'}
            </Badge>
          )}
        </button>
      </div>

      {/* TAB 1: PRICING PLANS & STATS CONFIG */}
      {activeTab === 'plans' && config && (
        <div className="space-y-8">
          {/* Section: Stats Configuration */}
          <Card className="border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="size-4 text-cyan-400" />
              {vi ? 'Chỉ Số Thống Kê Nổi Bật (Stats Banner)' : 'Highlighted Performance Stats'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.stats.map((st, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <Label className="text-xs text-slate-400">{vi ? `Chỉ số ${idx + 1} (Số liệu)` : `Stat ${idx + 1} (Value)`}</Label>
                  <Input
                    value={st.value}
                    onChange={(e) => updateStat(idx, { value: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white font-bold"
                  />
                  <Label className="text-xs text-slate-400">{vi ? 'Nhãn hiển thị (Tiếng Việt)' : 'Label (Vietnamese)'}</Label>
                  <Input
                    value={st.labelVi}
                    onChange={(e) => updateStat(idx, { labelVi: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white text-xs"
                  />
                  <Label className="text-xs text-slate-400">{vi ? 'Nhãn hiển thị (Tiếng Anh)' : 'Label (English)'}</Label>
                  <Input
                    value={st.labelEn}
                    onChange={(e) => updateStat(idx, { labelEn: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white text-xs"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Section: Plans Configuration */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="size-4 text-cyan-400" />
              {vi ? 'Cấu Hình Chi Tiết 3 Gói Cước Quảng Cáo' : 'Detailed 3-Tier Ad Plans Config'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {config.plans.map((plan, planIdx) => (
                <Card
                  key={plan.id}
                  className={`border-2 p-5 sm:p-6 flex flex-col justify-between transition-all ${
                    plan.highlight
                      ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/20 via-slate-900 to-slate-950 shadow-xl shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header of card */}
                    <div className="flex items-center justify-between">
                      <Input
                        value={plan.name}
                        onChange={(e) => updatePlan(planIdx, { name: e.target.value })}
                        className="bg-slate-950 border-slate-700 text-white font-bold text-lg w-2/3"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={plan.highlight}
                          onChange={(e) => {
                            // Only 1 plan highlighted at a time
                            const newPlans = config.plans.map((p, i) => ({
                              ...p,
                              highlight: i === planIdx ? e.target.checked : false,
                            }));
                            setConfig({ ...config, plans: newPlans });
                          }}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                        />
                        {vi ? 'Nổi bật' : 'Featured'}
                      </label>
                    </div>

                    {/* Badge */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-slate-400">{vi ? 'Huy hiệu (VI)' : 'Badge (VI)'}</Label>
                        <Input
                          value={plan.badgeVi || ''}
                          onChange={(e) => updatePlan(planIdx, { badgeVi: e.target.value || null })}
                          placeholder="vd: Phổ biến nhất"
                          className="bg-slate-950 border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">{vi ? 'Huy hiệu (EN)' : 'Badge (EN)'}</Label>
                        <Input
                          value={plan.badgeEn || ''}
                          onChange={(e) => updatePlan(planIdx, { badgeEn: e.target.value || null })}
                          placeholder="e.g. Most Popular"
                          className="bg-slate-950 border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Monthly Price */}
                    <div>
                      <Label className="text-xs text-slate-300 font-semibold">
                        {vi ? 'Giá niêm yết theo tháng (VNĐ) · (Để trống nếu Liên hệ)' : 'Monthly Price (VND) · (Blank for Contact Us)'}
                      </Label>
                      <Input
                        type="number"
                        value={plan.monthlyPrice !== null ? plan.monthlyPrice : ''}
                        onChange={(e) =>
                          updatePlan(planIdx, {
                            monthlyPrice: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder={vi ? 'vd: 2500000 (để trống = Liên hệ)' : 'e.g. 2500000'}
                        className="bg-slate-950 border-slate-700 text-white font-mono text-base font-bold mt-1"
                      />
                      {plan.monthlyPrice !== null && (
                        <p className="mt-1 text-xs text-cyan-400">
                          {formatCurrency(plan.monthlyPrice, lang)} / {vi ? 'tháng' : 'mo'} · ({formatCurrency(plan.monthlyPrice * 10, lang)} / {vi ? 'năm' : 'yr'})
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-[11px] text-slate-400">{vi ? 'Mô tả ngắn (Tiếng Việt)' : 'Short desc (VI)'}</Label>
                      <Textarea
                        value={plan.descriptionVi}
                        onChange={(e) => updatePlan(planIdx, { descriptionVi: e.target.value })}
                        rows={2}
                        className="bg-slate-950 border-slate-700 text-white text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-400">{vi ? 'Mô tả ngắn (Tiếng Anh)' : 'Short desc (EN)'}</Label>
                      <Textarea
                        value={plan.descriptionEn}
                        onChange={(e) => updatePlan(planIdx, { descriptionEn: e.target.value })}
                        rows={2}
                        className="bg-slate-950 border-slate-700 text-white text-xs mt-1"
                      />
                    </div>

                    {/* Features list */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-slate-300">
                          {vi ? 'Các tính năng trong gói:' : 'Plan Features:'}
                        </Label>
                        <button
                          type="button"
                          onClick={() => addFeature(planIdx)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                        >
                          <Plus className="size-3" /> {vi ? 'Thêm dòng' : 'Add feature'}
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {plan.featuresVi.map((fVi, fIdx) => (
                          <div key={fIdx} className="rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-1 relative group">
                            <button
                              type="button"
                              onClick={() => removeFeature(planIdx, fIdx)}
                              className="absolute top-1.5 right-1.5 text-slate-500 hover:text-rose-400 size-4 flex items-center justify-center rounded"
                            >
                              <X className="size-3" />
                            </button>
                            <Input
                              value={fVi}
                              onChange={(e) => updateFeatureText(planIdx, fIdx, e.target.value, true)}
                              placeholder="Tính năng tiếng Việt"
                              className="bg-slate-900 border-slate-700 text-white text-xs h-7"
                            />
                            <Input
                              value={plan.featuresEn[fIdx] || ''}
                              onChange={(e) => updateFeatureText(planIdx, fIdx, e.target.value, false)}
                              placeholder="Feature in English"
                              className="bg-slate-900 border-slate-700 text-slate-300 text-xs h-7"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING LEADS */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">{vi ? 'Lọc trạng thái:' : 'Status filter:'}</span>
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
                {['ALL', 'PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      statusFilter === st
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' && (vi ? 'Tất cả' : 'All')}
                    {st === 'PENDING' && (vi ? 'Chờ liên hệ' : 'Pending')}
                    {st === 'CONTACTED' && (vi ? 'Đã liên hệ' : 'Contacted')}
                    {st === 'CONVERTED' && (vi ? 'Đã chốt HĐ' : 'Converted')}
                    {st === 'REJECTED' && (vi ? 'Từ chối' : 'Rejected')}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="border-slate-800 text-slate-300 hover:bg-slate-800 gap-1.5"
            >
              <RefreshCw className="size-3.5" /> {vi ? 'Làm mới' : 'Refresh'}
            </Button>
          </div>

          {/* Table */}
          <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300">{vi ? 'Doanh nghiệp' : 'Company'}</TableHead>
                  <TableHead className="text-slate-300">{vi ? 'Người liên hệ' : 'Contact'}</TableHead>
                  <TableHead className="text-slate-300">{vi ? 'Gói quan tâm' : 'Plan'}</TableHead>
                  <TableHead className="text-slate-300">{vi ? 'Mục tiêu & Ghi chú' : 'Goals & Notes'}</TableHead>
                  <TableHead className="text-slate-300">{vi ? 'Thời gian' : 'Date'}</TableHead>
                  <TableHead className="text-slate-300">{vi ? 'Trạng thái' : 'Status'}</TableHead>
                  <TableHead className="text-right text-slate-300">{vi ? 'Hành động' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center text-slate-400">
                      <Building className="mx-auto size-8 text-slate-600 mb-2" />
                      {vi ? 'Chưa có yêu cầu hợp tác nào trong mục này.' : 'No partnership inquiries found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800/80 hover:bg-slate-800/40">
                      <TableCell className="font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Building className="size-4 text-cyan-400 shrink-0" />
                          <span>{lead.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <p className="font-medium text-slate-200">{lead.contactName}</p>
                          <p className="text-slate-400 flex items-center gap-1">
                            <Mail className="size-3 text-slate-500" />
                            <a href={`mailto:${lead.email}`} className="hover:text-cyan-400">{lead.email}</a>
                          </p>
                          {lead.phone && (
                            <p className="text-slate-400 flex items-center gap-1">
                              <Phone className="size-3 text-slate-500" />
                              <a href={`tel:${lead.phone}`} className="hover:text-cyan-400">{lead.phone}</a>
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs">
                          {lead.planName} · {lead.billingCycle === 'yearly' ? (vi ? 'Năm' : 'Yr') : (vi ? 'Tháng' : 'Mo')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-slate-300">
                        <p className="truncate" title={lead.goals}>{lead.goals || '—'}</p>
                        {lead.adminNote && (
                          <p className="text-[11px] text-amber-300 mt-1 italic">
                            Admin note: {lead.adminNote}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(lead.createdAt, lang)}
                      </TableCell>
                      <TableCell>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all ${
                            lead.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : lead.status === 'CONTACTED'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : lead.status === 'CONVERTED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <option value="PENDING" className="bg-slate-900 text-amber-300">{vi ? 'Chờ liên hệ' : 'Pending'}</option>
                          <option value="CONTACTED" className="bg-slate-900 text-blue-300">{vi ? 'Đã liên hệ' : 'Contacted'}</option>
                          <option value="CONVERTED" className="bg-slate-900 text-emerald-300">{vi ? 'Đã chốt HĐ' : 'Converted'}</option>
                          <option value="REJECTED" className="bg-slate-900 text-rose-300">{vi ? 'Từ chối' : 'Rejected'}</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 size-8 p-0"
                          title={vi ? 'Xóa đơn' : 'Delete'}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
