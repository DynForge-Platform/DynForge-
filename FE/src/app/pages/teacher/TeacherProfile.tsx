import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { VerifiedBadge, StarRating } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'sonner';
import {
  getMyMentorProfile, updateMyMentorProfile, type MentorProfileResponse,
} from '../../services/mentorService';
import { getMe, updateProfile } from '../../services/userService';

export function TeacherProfile() {
  const { refreshUser } = useAuth();
  const { lang } = useLanguage();
  const vi = lang === 'vi';
  const [profile, setProfile] = useState<MentorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');

  useEffect(() => {
    Promise.all([
      getMe().catch(() => null),
      getMyMentorProfile().catch(() => null),
    ]).then(([me, prof]) => {
      if (me) { setDisplayName(me.fullName ?? ''); setAvatarUrl(me.avatarUrl ?? ''); }
      if (prof) {
        setProfile(prof);
        setTitle(prof.title ?? '');
        setBio(prof.bio ?? '');
        setSkills((prof.skills ?? []).join(', '));
        setLanguages((prof.languages ?? []).join(', '));
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error(vi ? 'Vui lòng nhập tên hiển thị.' : 'Display name is required.'); return; }
    setSaving(true);
    try {
      // User-level fields (name, avatar)
      await updateProfile({ fullName: displayName.trim(), avatarUrl: avatarUrl.trim() || undefined });
      // Mentor-level fields — preserve existing courses/availability/formats so they aren't wiped
      await updateMyMentorProfile({
        title: title.trim(),
        bio: bio.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        courses: profile?.courses ?? [],
        formats: profile?.formats ?? ['Online', 'Offline'],
        availability: profile?.availability ?? {},
      });
      await refreshUser();
      toast.success(vi ? 'Đã lưu hồ sơ. Thay đổi hiển thị với học viên.' : 'Profile saved. Changes are visible to students.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? (vi ? 'Không lưu được hồ sơ.' : 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> {vi ? 'Đang tải hồ sơ…' : 'Loading profile…'}
      </div>
    );
  }

  const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{vi ? 'Hồ sơ Mentor của tôi' : 'My Mentor Profile'}</h1>
        <p className="mt-1 text-muted-foreground">{vi ? 'Chỉnh cách học viên nhìn thấy hồ sơ công khai của bạn.' : 'Edit how students see your public profile.'}</p>
      </div>

      {/* Preview strip */}
      <Card className="mb-6 flex items-center gap-4 border-border p-5">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-accent">
          {avatarUrl ? <img src={avatarUrl} alt={displayName} className="size-full object-cover" /> : <span className="text-xl" style={{ fontWeight: 600 }}>{initials || '?'}</span>}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 style={{ fontWeight: 600 }}>{displayName || (vi ? 'Tên của bạn' : 'Your name')}</h2>
            <VerifiedBadge verified={profile?.verified ?? false} />
          </div>
          <p className="text-sm text-primary">{title || (vi ? 'Thêm tiêu đề' : 'Add a headline')}</p>
          {profile && (
            <div className="mt-1 flex items-center gap-3 text-sm">
              <StarRating rating={profile.ratingAvg} count={profile.ratingCount} />
              <span className="text-muted-foreground">{profile.sessionsCount} {vi ? 'buổi học' : 'sessions'}</span>
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={save} className="space-y-6">
        {/* Basic info */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>{vi ? 'Thông tin cơ bản' : 'Basic information'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">{vi ? 'Tên hiển thị' : 'Display name'}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Đường dẫn ảnh đại diện' : 'Avatar URL'}</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className="bg-input-background" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">{vi ? 'Tiêu đề / chức danh' : 'Headline / title'}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={vi ? 'vd: Giảng viên AI/ML · Đại học FPT' : 'e.g. AI/ML Lecturer · FPT University'} className="bg-input-background" />
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>{vi ? 'Về tôi' : 'About me'}</h2>
          <Textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={vi ? 'Giới thiệu về bạn và cách bạn có thể hỗ trợ học viên.' : 'Tell students about your background and how you can help.'} />
        </Card>

        {/* Skills & languages */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>{vi ? 'Kỹ năng & ngôn ngữ' : 'Skills & languages'}</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{vi ? 'Kỹ năng' : 'Skills'} <span className="text-muted-foreground">{vi ? '(phân tách bằng dấu phẩy)' : '(comma-separated)'}</span></Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, TensorFlow, Data Analysis" className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">{vi ? 'Ngôn ngữ' : 'Languages'} <span className="text-muted-foreground">{vi ? '(phân tách bằng dấu phẩy)' : '(comma-separated)'}</span></Label>
              <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Vietnamese, English" className="bg-input-background" />
            </div>
          </div>
        </Card>

        {/* Courses (managed elsewhere; shown read-only, preserved on save) */}
        <Card className="border-border p-6">
          <h2 className="mb-3" style={{ fontWeight: 600 }}>{vi ? 'Các môn hỗ trợ' : 'Courses supported'}</h2>
          {profile?.courses?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.courses.map((c) => (
                <Badge key={c.code} variant="secondary" className="bg-accent text-accent-foreground">
                  {c.code} · {c.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{vi ? 'Chưa có môn học nào.' : 'No courses yet.'}</p>
          )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : (vi ? 'Lưu hồ sơ' : 'Save Profile')}
          </Button>
        </div>
      </form>
    </div>
  );
}
