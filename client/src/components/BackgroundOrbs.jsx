// Soft, slow-drifting gradient blobs fixed behind every page.
// Purely decorative — hidden from screen readers, no pointer events.
const BackgroundOrbs = () => (
  <div className="bg-orbs" aria-hidden="true">
    <div className="bg-orb bg-orb-1" />
    <div className="bg-orb bg-orb-2" />
    <div className="bg-orb bg-orb-3" />
    <div className="bg-orb bg-orb-4" />
  </div>
);

export default BackgroundOrbs;
