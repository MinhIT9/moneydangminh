import Image from 'next/image';

export type LandingVisualAltText = {
  hero: string;
  student: string;
  family: string;
};

type LandingVisualsProps = {
  alts: LandingVisualAltText;
  className?: string;
  priority?: boolean;
};

/**
 * A self-contained illustration cluster for the public landing page.
 *
 * Keep the alt text in the page's translation messages so this server component
 * remains reusable for every supported locale.
 */
export function LandingVisuals({ alts, className, priority = false }: LandingVisualsProps) {
  const rootClassName = ['landing-visuals', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <span className="landing-visuals__orb landing-visuals__orb--top" aria-hidden="true" />
      <span className="landing-visuals__orb landing-visuals__orb--bottom" aria-hidden="true" />

      <figure className="landing-visuals__frame landing-visuals__frame--hero">
        <Image
          className="landing-visuals__image"
          src="/images/vi-smart-hero.png"
          alt={alts.hero}
          width={1693}
          height={929}
          priority={priority}
          sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1180px) 48vw, 560px"
        />
        <span className="landing-visuals__shine" aria-hidden="true" />
      </figure>

      <figure className="landing-visuals__frame landing-visuals__frame--student">
        <Image
          className="landing-visuals__image"
          src="/images/vi-smart-student.png"
          alt={alts.student}
          width={1717}
          height={916}
          loading="lazy"
          sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1180px) 24vw, 272px"
        />
      </figure>

      <figure className="landing-visuals__frame landing-visuals__frame--family">
        <Image
          className="landing-visuals__image"
          src="/images/vi-smart-family.png"
          alt={alts.family}
          width={1672}
          height={941}
          loading="lazy"
          sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1180px) 24vw, 272px"
        />
      </figure>
    </div>
  );
}
