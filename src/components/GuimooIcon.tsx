import logoReduzida from '../imgs/guimoo/logo-reduzida.png';
import iconeTemaEscuro from '../imgs/guimoo/icone-para-tema-escuro.png';

interface GuimooIconProps {
  className?: string;
}

export default function GuimooIcon({ className }: GuimooIconProps) {
  return (
    <>
      <img
        src={logoReduzida}
        alt="Guimoo"
        className={`${className} dark:hidden`}
        style={{ objectFit: 'contain' }}
      />
      <img
        src={iconeTemaEscuro}
        alt="Guimoo"
        className={`${className} hidden dark:block`}
        style={{ objectFit: 'contain' }}
      />
    </>
  );
}
