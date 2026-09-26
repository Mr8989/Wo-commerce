import policies from '../data/policies';
import './Policy.css';

function Policy({ policy }) {
  const { title, sections } = policies[policy];

  return (
    <div className="policy-page container fade-in">
      <h1>{title}</h1>
      <p className="policy-brand">Cropped by Ayerkie – Home of Cherryberries</p>
      <div className="policy-body">
        {sections.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Policy;
