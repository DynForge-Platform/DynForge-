import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  getMe, updateProfile, changePassword, type UserProfile,
} from '../../services/userService';

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await changePassword(current, next);
      toast.success('Password changed. You may need to sign in again on other devices.');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Current password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="bg-input-background" autoFocus />
          </div>
          <div>
            <Label className="mb-1.5 block">New password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="bg-input-background" />
          </div>
          <div>
            <Label className="mb-1.5 block">Confirm new password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-input-background" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : 'Update password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardProfile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    getMe()
      .then((me) => {
        setProfile(me);
        setFullName(me.fullName ?? '');
        setPhone(me.phone ?? '');
        setStudentId(me.studentId ?? '');
        setMajor(me.major ?? '');
        setYear(me.year ?? '');
        setAvatarUrl(me.avatarUrl ?? '');
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required.'); return; }
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        studentId: studentId.trim() || undefined,
        major: major.trim() || undefined,
        year: year.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      await refreshUser();
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  const initials = fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your personal information and account security.</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Avatar */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-accent">
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="size-full object-cover" />
                : <span className="text-2xl" style={{ fontWeight: 600 }}>{initials || '?'}</span>}
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className="bg-input-background" />
            </div>
          </div>
        </Card>

        {/* Personal info */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Email</Label>
              <Input value={profile?.email ?? ''} disabled className="bg-muted/50" />
            </div>
            <div>
              <Label className="mb-1.5 block">Phone number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Student ID</Label>
              <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Major</Label>
              <Input value={major} onChange={(e) => setMajor(e.target.value)} className="bg-input-background" />
            </div>
            <div>
              <Label className="mb-1.5 block">Year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2022" className="bg-input-background" />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Security</h2>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p style={{ fontWeight: 500 }}>Password</p>
              <p className="text-sm text-muted-foreground">Change your account password.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPassword(true)}>Change</Button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </form>

      {showPassword && <ChangePasswordDialog onClose={() => setShowPassword(false)} />}
    </div>
  );
}
