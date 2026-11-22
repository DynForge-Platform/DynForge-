import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadAvatar } from '../services/userService';

/** "Upload photo" button: pick an image from the device → shrink → upload → saved right away. */
export function AvatarUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { refreshUser } = useAuth();
  const { lang } = useLanguage();
  const vi = lang === 'vi';

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(vi ? 'Vui lòng chọn một tệp ảnh.' : 'Please choose an image file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(vi ? 'Ảnh quá lớn (tối đa 20 MB).' : 'Image is too large (max 20 MB).');
      return;
    }
    setBusy(true);
    try {
      const me = await uploadAvatar(file);
      onUploaded(me.avatarUrl ?? '');
      await refreshUser();
      toast.success(vi ? 'Đã cập nhật ảnh đại diện.' : 'Profile photo updated.');
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? (err?.message === 'decode'
          ? (vi ? 'Không đọc được ảnh này. Hãy chọn ảnh JPG hoặc PNG.' : 'Could not read this image. Please use JPG or PNG.')
          : (vi ? 'Không tải được ảnh lên, vui lòng thử lại.' : 'Upload failed, please try again.'));
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? (vi ? 'Đang tải lên…' : 'Uploading…') : (vi ? 'Tải ảnh lên' : 'Upload photo')}
      </Button>
    </>
  );
}
