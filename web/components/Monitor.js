// Decorative patient-monitor panel. The trace is a drawing, not patient data.
const BEAT = "l 40 0 q 12 -18 24 0 l 16 0 l 6 14 l 10 -84 l 10 104 l 6 -34 l 16 0 q 18 -26 36 0 l 44 0 ";
const Strip = () => (
  <svg viewBox="0 0 624 140" aria-hidden="true"><path d={"M0 80 " + BEAT.repeat(3)} /></svg>
);

export default function Monitor() {
  return (
    <div className="monitor" role="img" aria-label="Decorative heart monitor trace">
      <div className="mon-top"><span className="live"><i />LEAD II</span><span>SAMPLE TRACE</span></div>
      <div className="mon-screen"><div className="mon-track"><Strip /><Strip /></div></div>
      <div className="mon-read">
        <div><small>INPUTS</small><b>13</b></div>
        <div><small>MODEL TYPES</small><b>5</b></div>
        <div><small>OUTPUT</small><b>Risk %</b></div>
      </div>
    </div>
  );
}
