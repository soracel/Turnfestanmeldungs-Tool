export function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    members: 'M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5',
    review: 'm12 3 10 18H2ZM12 9v5m0 3v1',
    contest: 'M5 4h14v17H5ZM9 3h6v4H9zM9 12l2 2 4-4M9 18h6',
    upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
    shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ? (
        <>
          <path d={paths[name]} />
          {name === 'members' && <circle cx="9" cy="8" r="3" />}
        </>
      ) : (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      )}
    </svg>
  );
}
