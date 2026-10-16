export interface BrandProps {
  variant: 'light' | 'dark';
}

export function Brand({ variant }: BrandProps) {
  return (
    <a className={`brand brand--${variant}`} href="/" aria-label="CONFRA home">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark__bar brand-mark__bar--one" />
        <span className="brand-mark__bar brand-mark__bar--two" />
        <span className="brand-mark__bar brand-mark__bar--three" />
      </span>
      <span>CONFRA</span>
    </a>
  );
}

export default Brand;
