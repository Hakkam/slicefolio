import { useRef, useState } from 'react';
import { FileImage, FileText, LockKeyhole, UploadCloud } from 'lucide-react';
import { pick, type Locale } from '../i18n';

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  locale?: Locale;
}

export function Dropzone({ onFile, disabled = false, locale = 'en' }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = () => {
    if (!disabled) inputRef.current?.click();
  };

  const acceptFile = (file?: File) => {
    if (file && !disabled) onFile(file);
  };

  return (
    <div className="upload-shell">
      <button
        type="button"
        className={`dropzone${dragging ? ' is-dragging' : ''}`}
        onClick={pickFile}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
        disabled={disabled}
      >
        <span className="dropzone-icon" aria-hidden="true">
          <UploadCloud size={26} strokeWidth={1.8} />
        </span>
        <span className="dropzone-copy">
          <strong>{pick(locale, 'Drop your full-page design here', 'ضع تصميم الصفحة الكاملة هنا')}</strong>
          <span>{pick(locale, 'or click to choose a file', 'أو اضغط لاختيار ملف')}</span>
        </span>
        <span className="dropzone-formats">
          <span><FileText size={15} /> PDF</span>
          <span><FileImage size={15} /> PNG, JPG, WebP</span>
          <span>{pick(locale, 'Up to 250 MB', 'حتى 250 ميجابايت')}</span>
        </span>
      </button>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        tabIndex={-1}
        accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp"
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.currentTarget.value = '';
        }}
      />

      <div className="privacy-note">
        <LockKeyhole size={15} />
        <span>{pick(locale, 'Your files stay in your browser. Nothing is uploaded.', 'تبقى ملفاتك داخل متصفحك. لا يتم رفع أي شيء.')}</span>
      </div>
    </div>
  );
}
