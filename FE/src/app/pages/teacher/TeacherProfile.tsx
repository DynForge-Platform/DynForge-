import { useState } from 'react';
import { Camera, Eye } from 'lucide-react';
import { mentors } from '../../data/mockData';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { VerifiedBadge, StarRating } from '../../components/common';
import { formatCurrency } from '../../data/mockData';
import { toast } from 'sonner';

const mentor = mentors[0]; // Linh Nguyen

const helpAreas = [
  'Course tutoring', 'Assignment guidance', 'Research methods',
  'Thesis support', 'Career orientation', 'Academic writing',
];

export function TeacherProfile() {
  const [rate, setRate] = useState(String(mentor.hourlyRate));
  const [editHelp, setEditHelp] = useState<string[]>(helpAreas.slice(0, 3));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile saved. Changes will be visible to students.');
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Mentor Profile</h1>
          <p className="mt-1 text-muted-foreground">Edit how students see your public profile.</p>
        </div>
        <Button variant="outline" onClick={() => toast.info('Profile preview opens in new tab.')}>
          <Eye className="size-4" /> Preview
        </Button>
      </div>

      {/* Preview strip */}
      <Card className="mb-6 flex items-center gap-4 border-border p-5">
        <ImageWithFallback src={mentor.avatar} alt={mentor.name} className="size-16 rounded-2xl object-cover" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 style={{ fontWeight: 600 }}>{mentor.name}</h2>
            <VerifiedBadge verified={mentor.verified} />
          </div>
          <p className="text-sm text-primary">{mentor.role} · {mentor.university}</p>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <StarRating rating={mentor.rating} count={mentor.reviewsCount} />
            <span className="text-muted-foreground">{mentor.sessionsCompleted} sessions</span>
            <span className="text-muted-foreground">{formatCurrency(mentor.hourlyRate)}/hr</span>
          </div>
        </div>
      </Card>

      <form onSubmit={save} className="space-y-6">
        {/* Avatar */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <ImageWithFallback src={mentor.avatar} alt={mentor.name} className="size-20 rounded-2xl object-cover" />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-primary text-white"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <Button type="button" variant="outline" size="sm">Upload new photo</Button>
          </div>
        </Card>

        {/* Basic info */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>Basic information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" id="dname" defaultValue={mentor.name} />
            <div>
              <Label className="mb-1.5 block">Hourly rate (₫)</Label>
              <Input id="rate" value={rate} onChange={(e) => setRate(e.target.value)} className="bg-input-background" />
            </div>
            <Field label="University" id="uni" defaultValue={mentor.university} />
            <Field label="Major" id="major" defaultValue={mentor.major} />
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Headline</Label>
              <Input id="headline" defaultValue={mentor.headline} className="bg-input-background" />
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="border-border p-6">
          <h2 className="mb-4" style={{ fontWeight: 600 }}>About me</h2>
          <Textarea rows={5} defaultValue={mentor.about} />
        </Card>

        {/* Help areas */}
        <Card className="border-border p-6">
          <h2 className="mb-3" style={{ fontWeight: 600 }}>How I can help</h2>
          <p className="mb-3 text-sm text-muted-foreground">Select the areas you offer support in.</p>
          <div className="flex flex-wrap gap-2">
            {helpAreas.map((h) => {
              const active = editHelp.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() =>
                    setEditHelp((prev) =>
                      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
                    )
                  }
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Courses */}
        <Card className="border-border p-6">
          <h2 className="mb-3" style={{ fontWeight: 600 }}>Courses supported</h2>
          <div className="flex flex-wrap gap-2">
            {mentor.courses.map((c) => (
              <Badge key={c.code} variant="secondary" className="bg-accent text-accent-foreground">
                {c.code} · {c.name}
              </Badge>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-3 text-primary">
            + Add course
          </Button>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">Save Profile</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, id, defaultValue }: { label: string; id: string; defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">{label}</Label>
      <Input id={id} defaultValue={defaultValue} className="bg-input-background" />
    </div>
  );
}
