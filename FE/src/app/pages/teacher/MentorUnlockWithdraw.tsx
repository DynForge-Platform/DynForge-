import { useNavigate } from 'react-router';
import { BadgeCheck, Building2, CalendarCheck, ShieldCheck, Scale, Lock, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useLanguage } from '../../context/LanguageContext';

type StepStatus = 'completed' | 'in-progress' | 'required' | 'blocked';

interface CheckItem {
  icon: React.ElementType;
  label: string;
  description: string;
  status: StepStatus;
  action?: string;
  route?: string;
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') return <CheckCircle2 className="size-5 text-success" />;
  if (status === 'in-progress') return <Clock className="size-5 text-warning" />;
  if (status === 'blocked') return <AlertCircle className="size-5 text-danger" />;
  return <Lock className="size-5 text-muted-foreground" />;
}

export function MentorUnlockWithdraw() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const vi = lang === 'vi';

  const steps: CheckItem[] = [
    { icon: BadgeCheck, label: vi ? 'Hoàn thiện hồ sơ mentor' : 'Complete mentor profile', description: vi ? 'Thêm tiêu đề, phần giới thiệu, thẻ chuyên môn và các môn hỗ trợ.' : 'Add your headline, about section, expertise tags, and courses supported.', status: 'completed' },
    { icon: ShieldCheck, label: vi ? 'Xác minh email trường' : 'Verify university email', description: vi ? 'Xác nhận email trường để chứng minh bạn thuộc trường đại học.' : 'Confirm your university email to prove your academic affiliation.', status: 'completed' },
    { icon: BadgeCheck, label: vi ? 'Tải bảng điểm hoặc minh chứng chuyên môn' : 'Upload transcript or proof of expertise', description: vi ? 'Nộp bảng điểm hoặc tài liệu chứng minh năng lực liên quan.' : 'Submit your academic transcript or relevant qualification document.', status: 'in-progress', action: vi ? 'Tải tài liệu' : 'Upload Documents', route: '/mentor/verification' },
    { icon: Building2, label: vi ? 'Thêm tài khoản ngân hàng đã xác minh' : 'Add verified bank account', description: vi ? 'Liên kết tài khoản ngân hàng hợp lệ để nhận thu nhập an toàn.' : 'Link a valid bank account to receive your earnings securely.', status: 'required', action: vi ? 'Thêm tài khoản' : 'Add Bank Account', route: '/mentor/wallet' },
    { icon: CalendarCheck, label: vi ? 'Hoàn tất buổi học có phí đầu tiên' : 'Complete first paid session', description: vi ? 'Hoàn tất ít nhất một buổi học đã được học viên xác nhận.' : 'Finish at least one session that has been confirmed by the student.', status: 'required', action: vi ? 'Xem buổi học' : 'View Sessions', route: '/mentor/sessions' },
    { icon: Scale, label: vi ? 'Giải quyết các tranh chấp đang mở' : 'Resolve any active disputes', description: vi ? 'Việc rút tiền sẽ bị giữ nếu bạn có tranh chấp đang được xem xét.' : 'Withdrawals are held if you have an open dispute under review.', status: 'completed' },
  ];

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const statusLabel: Record<StepStatus, { label: string; bg: string }> = {
    completed: { label: vi ? 'Hoàn thành' : 'Completed', bg: 'bg-success/10 text-success border-success/20' },
    'in-progress': { label: vi ? 'Đang thực hiện' : 'In progress', bg: 'bg-warning/10 text-warning border-warning/20' },
    required: { label: vi ? 'Bắt buộc' : 'Required', bg: 'bg-muted text-muted-foreground border-border' },
    blocked: { label: vi ? 'Bị khoá' : 'Blocked', bg: 'bg-danger/10 text-danger border-danger/20' },
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Mở khoá rút tiền' : 'Unlock Withdrawals'}</h1>
        <p className="mt-1 text-muted-foreground">
          {vi ? 'Hoàn thành các bước dưới đây để mở khoá thu nhập và bắt đầu nhận giải ngân.' : 'Complete the steps below to unlock your earnings and start receiving payouts.'}
        </p>
      </div>

      {/* Status card */}
      <Card className="mb-6 border-warning/20 bg-warning/5 p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="text-warning" style={{ fontWeight: 600 }}>{vi ? 'Rút tiền hiện đang bị khoá' : 'Withdrawals are currently locked'}</p>
            <p className="text-sm text-muted-foreground">
              {vi ? 'Hoàn thành tất cả bước bắt buộc để mở khoá khả năng rút tiền. Đây là quy trình một lần.' : 'Complete all required steps to unlock your payout capability. This is a one-time process.'}
            </p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{vi ? `Đã hoàn thành ${completedCount}/${steps.length} bước` : `${completedCount} of ${steps.length} steps completed`}</span>
                <span style={{ fontWeight: 600 }}>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* Checklist */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const meta = statusLabel[step.status];
          return (
            <Card key={step.label} className={`border-border p-5 ${step.status === 'completed' ? 'opacity-75' : ''}`}>
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p style={{ fontWeight: 600 }}>{i + 1}. {step.label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${meta.bg}`} style={{ fontWeight: 500 }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  {step.action && step.route && (
                    <Button
                      size="sm"
                      className="mt-3"
                      variant={step.status === 'in-progress' ? 'default' : 'outline'}
                      onClick={() => navigate(step.route!)}
                    >
                      {step.action}
                    </Button>
                  )}
                </div>
                <StatusIcon status={step.status} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button size="lg" onClick={() => navigate('/mentor/verification')}>{vi ? 'Hoàn tất xác minh' : 'Complete Verification'}</Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/support/contact')}>{vi ? 'Liên hệ hỗ trợ' : 'Contact Support'}</Button>
      </div>
    </div>
  );
}
