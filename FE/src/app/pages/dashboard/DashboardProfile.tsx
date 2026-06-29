import { useState } from 'react';
import { Camera, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Progress } from '../../components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { universities, subjects, academicLevels } from '../../data/mockData';
import { toast } from 'sonner';

const modes = ['Online', 'Offline', 'Both'];

export function DashboardProfile() {
  const [preferMode, setPreferMode] = useState('Online');
  const [tfa, setTfa] = useState(false);
  const completion = 72;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully.');
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your personal information and learning preferences.</p>
      </div>

      {/* Completion bar */}
      <Card className="mb-6 border-border p-5">
        <div className="mb-2 flex items-center justify-between">
          <span style={{ fontWeight: 500 }}>Profile completeness</span>
          <span className="text-sm text-primary" style={{ fontWeight: 600 }}>{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          Add your university email and learning preferences to reach 100%.
        </p>
      </Card>

      <form onSubmit={save} className="space-y-6">
        {/* Avatar */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-accent">
                <span className="text-3xl">TD</span>
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-primary text-white"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div>
              <p style={{ fontWeight: 500 }}>Trang Do</p>
              <p className="text-sm text-muted-foreground">Student · VNU University of Science</p>
              <Button type="button" variant="outline" size="sm" className="mt-2">
                Upload photo
              </Button>
            </div>
          </div>
        </Card>

        {/* Personal info */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Personal information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" id="name" defaultValue="Trang Do" />
            <Field label="Email" id="email" type="email" defaultValue="trang@gmail.com" />
            <Field label="University email" id="uni-email" type="email" defaultValue="trang@student.vnu.edu.vn" />
            <Field label="Phone number" id="phone" type="tel" defaultValue="+84 912 345 678" />
            <div>
              <Label className="mb-1.5 block">University</Label>
              <Select defaultValue={universities[0]}>
                <SelectTrigger className="bg-input-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Major" id="major" defaultValue="Computer Science" />
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Academic level</Label>
              <Select defaultValue="Undergraduate">
                <SelectTrigger className="bg-input-background sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {academicLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Learning preferences */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Learning preferences</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Preferred subjects</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="cursor-pointer bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Preferred learning mode</Label>
              <div className="flex flex-wrap gap-2">
                {modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreferMode(m)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      preferMode === m
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-accent'
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Preferred language</Label>
              <Select defaultValue="Vietnamese">
                <SelectTrigger className="bg-input-background sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p style={{ fontWeight: 500 }}>Password</p>
                <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
              </div>
              <Button type="button" variant="outline" size="sm">Change</Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent">
                  <LinkIcon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p style={{ fontWeight: 500 }}>Google account</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-muted-foreground">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p style={{ fontWeight: 500 }}>Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">{tfa ? 'Enabled' : 'Not enabled'}</p>
                </div>
              </div>
              <Switch checked={tfa} onCheckedChange={setTfa} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, id, type = 'text', defaultValue }: { label: string; id: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} className="bg-input-background" />
    </div>
  );
}
