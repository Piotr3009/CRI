import { BuildingIcon, HomeIcon, CheckIcon, LockIcon } from "./Icons";

const COMMERCIAL = [
  "Developers",
  "Main contractors",
  "Management companies",
  "Housing associations",
  "Commercial clients",
  "Company profiles may be visible when legally appropriate",
];

const RESIDENTIAL = [
  "Private residential clients",
  "Postcode / area-based records",
  "Initials instead of full public names",
  "Full sensitive data restricted to verified contractors / admins",
  "No public naming and shaming",
];

export function ResidentialCommercialSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-cri-green">
            Two report types
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-cri-charcoal">
            Residential vs Commercial
          </h2>
          <p className="mt-3 text-cri-steel">
            Different entities carry different privacy obligations. CRI treats
            residential records with stronger restrictions.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cri-green/10 text-cri-green">
                <BuildingIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-cri-charcoal">
                Commercial Risk Reports
              </h3>
            </div>
            <ul className="mt-5 space-y-3">
              {COMMERCIAL.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-cri-charcoal">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cri-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cri-amber-light text-cri-amber-dark">
                <HomeIcon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-cri-charcoal">
                Residential Risk Records
              </h3>
            </div>
            <ul className="mt-5 space-y-3">
              {RESIDENTIAL.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-cri-charcoal">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-cri-green" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-cri-bg p-3 text-xs text-cri-steel">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-cri-steel" />
              Residential records show initials and area only. Full details are
              restricted to verified contractors and administrators.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
