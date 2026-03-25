import { describe, it, expect } from 'vitest';
import { isSupportedFormat, getMimeFromExtension } from '../../src/modules/convert/convert.service';

describe('Convert Service — Pure Functions', () => {
  // ===== isSupportedFormat =====
  describe('isSupportedFormat', () => {
    it('recognizes Word documents', () => {
      expect(isSupportedFormat('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(isSupportedFormat('application/msword')).toBe(true);
    });

    it('recognizes Excel spreadsheets', () => {
      expect(isSupportedFormat('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true);
      expect(isSupportedFormat('application/vnd.ms-excel')).toBe(true);
    });

    it('recognizes PowerPoint presentations', () => {
      expect(isSupportedFormat('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe(true);
      expect(isSupportedFormat('application/vnd.ms-powerpoint')).toBe(true);
    });

    it('recognizes text formats', () => {
      expect(isSupportedFormat('text/plain')).toBe(true);
      expect(isSupportedFormat('text/html')).toBe(true);
      expect(isSupportedFormat('text/markdown')).toBe(true);
      expect(isSupportedFormat('application/rtf')).toBe(true);
    });

    it('recognizes image formats', () => {
      expect(isSupportedFormat('image/png')).toBe(true);
      expect(isSupportedFormat('image/jpeg')).toBe(true);
      expect(isSupportedFormat('image/gif')).toBe(true);
      expect(isSupportedFormat('image/bmp')).toBe(true);
      expect(isSupportedFormat('image/tiff')).toBe(true);
      expect(isSupportedFormat('image/webp')).toBe(true);
    });

    it('recognizes PDF passthrough', () => {
      expect(isSupportedFormat('application/pdf')).toBe(true);
    });

    it('rejects unknown MIME types', () => {
      expect(isSupportedFormat('application/zip')).toBe(false);
      expect(isSupportedFormat('video/mp4')).toBe(false);
      expect(isSupportedFormat('application/octet-stream')).toBe(false);
      expect(isSupportedFormat('')).toBe(false);
    });
  });

  // ===== getMimeFromExtension =====
  describe('getMimeFromExtension', () => {
    it('maps Office extensions to correct MIME types', () => {
      expect(getMimeFromExtension('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeFromExtension('doc')).toBe('application/msword');
      expect(getMimeFromExtension('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(getMimeFromExtension('xls')).toBe('application/vnd.ms-excel');
      expect(getMimeFromExtension('pptx')).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
      expect(getMimeFromExtension('ppt')).toBe('application/vnd.ms-powerpoint');
    });

    it('maps text extensions correctly', () => {
      expect(getMimeFromExtension('txt')).toBe('text/plain');
      expect(getMimeFromExtension('html')).toBe('text/html');
      expect(getMimeFromExtension('md')).toBe('text/markdown');
      expect(getMimeFromExtension('rtf')).toBe('application/rtf');
    });

    it('maps image extensions correctly', () => {
      expect(getMimeFromExtension('png')).toBe('image/png');
      expect(getMimeFromExtension('jpg')).toBe('image/jpeg');
      expect(getMimeFromExtension('jpeg')).toBe('image/jpeg');
      expect(getMimeFromExtension('gif')).toBe('image/gif');
      expect(getMimeFromExtension('bmp')).toBe('image/bmp');
      expect(getMimeFromExtension('tiff')).toBe('image/tiff');
      expect(getMimeFromExtension('webp')).toBe('image/webp');
    });

    it('maps pdf extension correctly', () => {
      expect(getMimeFromExtension('pdf')).toBe('application/pdf');
    });

    it('is case-insensitive', () => {
      expect(getMimeFromExtension('DOCX')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeFromExtension('PNG')).toBe('image/png');
    });

    it('returns octet-stream for unknown extensions', () => {
      expect(getMimeFromExtension('zip')).toBe('application/octet-stream');
      expect(getMimeFromExtension('exe')).toBe('application/octet-stream');
      expect(getMimeFromExtension('xyz')).toBe('application/octet-stream');
    });
  });
});
