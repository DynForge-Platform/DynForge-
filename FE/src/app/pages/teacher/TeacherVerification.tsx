import { useState, useRef } from 'react';
import {
  Upload, FileText, Mail, Mic, BadgeCheck, X,
  CheckCircle2, Award, BookOpen, Briefcase,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StepProgress } from '../../components/common';
import { cn } from '../../components/ui/utils';
import { toast } from 'sonner';

const steps = [
  'Basic information',
  'University email',
  'Documents upload',
  'Interview',
  'Approved',
];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

const certTypes = [
  { key: 'transcript', icon: BookOpen, label: 'Academic Transcript', desc: 'Official transcript or grade report from your university.', accept: '.pdf,.jpg,.png' },
  { key: 'certificate', icon: Award, label: 'Certificates & Awards', desc: 'Relevant course certificates, competition awards, or scholarships.', accept: '.pdf,.jpg,.png' },
  { key: 'portfolio', icon: Briefcase, label: 'Portfolio / Work Samples', desc: 'Projects, capstone work, or professional experience evidence.', accept: '.pdf,.jpg,.png,.zip' },
  { key: 'id', icon: FileText, label: 'Student / Staff ID', desc: 'Your valid university student card or staff ID.', accept: '.jpg,.png' },
];

function UploadZone({
  certKey,
  label,
  accept,
  files,
  onAdd,
  onRemove,
}: {
  certKey: string;
  label: string;
  accept: string;
  files: UploadedFile[];
  onAdd: (key: string, files: UploadedFile[]) => void;
  onRemove: (key: string, name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    onAdd(certKey, newFiles);
    toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-sm transition-colors',
          dragging
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-accent/40 text-muted-foreground hover:border-primary/50 hover:bg-accent'
        )}
      >
        <span className={cn(
          'flex size-11 items-center justify-center rounded-xl',
          dragging ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'
        )}>
          <Upload className="size-5" />
        </span>
        <div className="text-center">
          <p style={{ fontWeight: 600 }} className={dragging ? 'text-primary' : 'text-foreground'}>
            {dragging ? 'Drop files here' : 'Click to upload or drag & drop'}
          </p>
          <p className="text-xs mt-0.5">Accepted: {accept} · Max 10 MB per file</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {/* Uploaded files list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="size-10 rounded-lg object-cover" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm" style={{ fontWeight: 500 }}>{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
              </div>
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <button
                type="button"
                onClick={() => onRemove(certKey, f.name)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const baseDocuments = [
  { icon: Mail, title: 'University email verification', description: 'Verify your university email address to confirm your enrollment.', accepted: 'email' },
  { icon: Mic, title: 'Verification interview', description: 'A short 15-minute online call with a GRADORA team member.', accepted: 'scheduled' },
];

export function TeacherVerification() {
  const currentStep = 2;
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalUploaded = Object.values(uploadedFiles).flat().length;

  const addFiles = (key: string, files: UploadedFile[]) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ...files] }));
  };

  const removeFile = (key: string, name: string) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((f) => f.name !== name) }));
  };

  const handleSubmit = () => {
    if (totalUploaded === 0) {
      toast.error('Please upload at least one document before submitting.');
      return;
    }
    setSubmitted(true);
    toast.success('Documents submitted! GRADORA will review within 2–3 business days.');
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Mentor Verification</h1>
        <p className="mt-1 text-muted-foreground">
          Complete verification to become a listed, trusted mentor on GRADORA.
        </p>
      </div>

      <Card className="mb-8 border-border p-8">
        <StepProgress steps={steps} current={currentStep} />
      </Card>

      {/* Status banner */}
      <Card className="mb-6 border-warning/20 bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <p className="text-warning" style={{ fontWeight: 600 }}>Verification in progress</p>
            <p className="text-sm text-muted-foreground">
              You've completed 2 of 5 steps. Upload your documents below to proceed to the interview stage.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Certificate upload section ───────────────────────── */}
      <Card className="mb-6 border-border p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upload documents &amp; certificates</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload at least one document. Multiple file types accepted.
            </p>
          </div>
          {totalUploaded > 0 && (
            <span className="rounded-full bg-success/15 px-3 py-1 text-sm text-success" style={{ fontWeight: 600 }}>
              {totalUploaded} file{totalUploaded > 1 ? 's' : ''} ready
            </span>
          )}
        </div>

        <div className="space-y-5">
          {certTypes.map(({ key, icon: Icon, label, desc, accept }) => (
            <div key={key} className="rounded-2xl border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 600 }}>{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                  <UploadZone
                    certKey={key}
                    label={label}
                    accept={accept}
                    files={uploadedFiles[key] ?? []}
                    onAdd={addFiles}
                    onRemove={removeFile}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitted ? (
            <><CheckCircle2 className="size-4" /> Documents submitted</>
          ) : (
            <><Upload className="size-4" /> Submit documents for review</>
          )}
        </Button>
      </Card>

      {/* Remaining steps */}
      <div className="space-y-4">
        {baseDocuments.map((doc, i) => {
          const Icon = doc.icon;
          return (
            <Card key={doc.title} className="border-border p-6 opacity-60">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <p style={{ fontWeight: 600 }}>{doc.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground italic">Available after documents are approved.</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-border p-5">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Typical verification time:</strong> 2–3 business days after all documents are submitted. You'll receive an email update at each stage.
        </p>
      </Card>
    </div>
  );
}
