import Trace from "./Trace";

export default function PageHead({ kicker, title, children }) {
  return (
    <div className="pagehead">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      {children && <p className="lead">{children}</p>}
      <Trace />
    </div>
  );
}
