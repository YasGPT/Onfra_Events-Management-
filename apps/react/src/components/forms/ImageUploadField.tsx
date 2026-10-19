import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import { Icon } from '../common';
import type { MediaUploadPayload } from '../../types';

export interface ImageUploadFieldProps {
  id: string;
  label: string;
  sublabel?: string;
  hint?: string;
  variant?: 'logo' | 'banner';
  value?: MediaUploadPayload | null;
  onChange: (payload: MediaUploadPayload | null) => void;
  error?: string;
  optional?: boolean;
}

export function ImageUploadField({
  id,
  label,
  sublabel,
  hint,
  variant = 'logo',
  value,
  onChange,
  error,
  optional = true,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    setLocalError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setLocalError('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange({
        storage_key: dataUrl,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      });
    };
    reader.onerror = () => {
      setLocalError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };

  const isBanner = variant === 'banner';
  const displayError = error || localError;

  return (
    <div className={`image-upload-field ${isBanner ? 'image-upload-field--banner' : 'image-upload-field--logo'} ${displayError ? 'image-upload-field--error' : ''}`}>
      <div className="image-upload-field__header">
        <label htmlFor={id} className="image-upload-field__label">
          {label}
          {optional && <span className="image-upload-field__optional">Optional</span>}
        </label>
        {sublabel && <span className="image-upload-field__sublabel">{sublabel}</span>}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="sr-only"
        aria-invalid={Boolean(displayError)}
      />

      {value?.storage_key ? (
        <div className={`image-upload-preview ${isBanner ? 'image-upload-preview--banner' : 'image-upload-preview--logo'}`}>
          <img src={value.storage_key} alt={value.original_filename || label} className="image-upload-preview__img" />
          <div className="image-upload-preview__overlay">
            <div className="image-upload-preview__meta">
              <span className="image-upload-preview__filename" title={value.original_filename}>
                {value.original_filename}
              </span>
              {value.file_size_bytes && (
                <span className="image-upload-preview__size">{formatFileSize(value.file_size_bytes)}</span>
              )}
            </div>
            <div className="image-upload-preview__actions">
              <button
                type="button"
                className="image-upload-btn image-upload-btn--change"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="refresh" /> Change
              </button>
              <button
                type="button"
                className="image-upload-btn image-upload-btn--remove"
                onClick={handleRemove}
                aria-label="Remove image"
              >
                <Icon name="trash" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`image-upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="image-upload-dropzone__icon">
            <Icon name={isBanner ? 'building' : 'plus'} />
          </div>
          <div className="image-upload-dropzone__content">
            <span className="image-upload-dropzone__action">
              <strong>Upload {label}</strong> or drag and drop
            </span>
            <span className="image-upload-dropzone__hint">
              {hint || (isBanner ? 'Recommended 1200×400px (3:1) · PNG, JPG, WebP up to 5MB' : 'Recommended 400×400px (1:1) · PNG, JPG, SVG up to 5MB')}
            </span>
          </div>
        </div>
      )}

      {displayError ? (
        <small className="field-message">{displayError}</small>
      ) : null}
    </div>
  );
}

export default ImageUploadField;
