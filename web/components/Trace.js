// One heartbeat (P wave, QRS complex, T wave), repeated into a strip that draws itself once.
const BEAT = "l 18 0 q 6 -9 12 0 l 8 0 l 3 7 l 5 -42 l 5 52 l 3 -17 l 8 0 q 9 -13 18 0 l 22 0 ";
export default function Trace() {
  return (
    <svg className="trace" viewBox="0 0 1000 70" aria-hidden="true">
      <path d={"M0 40 " + BEAT.repeat(10)} pathLength="1" />
    </svg>
  );
}
