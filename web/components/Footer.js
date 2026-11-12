import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-in">
          <div>
            <p className="foot-brand"><Logo size={24} />HeartRisk</p>
            <p>Early heart disease screening, built on a cross-validated comparison of four classifiers and a soft-voting ensemble.</p>
          </div>
          <div>
            <h2>Explore</h2>
            <ul><li><Link href="/screen">Screening</Link></li><li><Link href="/history">History</Link></li><li><Link href="/evidence">Model evidence</Link></li></ul>
          </div>
          <div>
            <h2>Data</h2>
            <p>UCI Heart Disease (Cleveland) dataset, 13 clinical measurements per patient.</p>
          </div>
        </div>
        <p className="legal">An educational research tool. It is not a medical device and does not give a diagnosis. See a clinician for any health concern.</p>
      </div>
    </footer>
  );
}
