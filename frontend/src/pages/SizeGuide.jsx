import './Policy.css';

// General UK women's sizing; replace with the shop's own garment
// measurements if items run differently.
const sizes = [
  ['XS', '6', '78–81', '60–63', '86–89'],
  ['S', '8–10', '82–87', '64–69', '90–95'],
  ['M', '12', '88–92', '70–74', '96–100'],
  ['L', '14', '93–97', '75–79', '101–105'],
  ['XL', '16', '98–102', '80–84', '106–110'],
  ['XXL', '18', '103–108', '85–90', '111–116'],
];

function SizeGuide() {
  return (
    <div className="policy-page container fade-in">
      <h1>Size Guide</h1>
      <p className="policy-brand">Cropped by Ayerkie – Home of Cherryberries</p>
      <div className="policy-body">
        <section>
          <p>
            Measurements are body measurements in centimetres. Fit can vary between styles,
            so check the product description, and message us on WhatsApp if you're unsure.
          </p>
        </section>

        <section>
          <div className="size-table-wrap">
            <table className="size-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>UK</th>
                  <th>Bust</th>
                  <th>Waist</th>
                  <th>Hips</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map(([size, uk, bust, waist, hips]) => (
                  <tr key={size}>
                    <th>{size}</th>
                    <td>{uk}</td>
                    <td>{bust}</td>
                    <td>{waist}</td>
                    <td>{hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>How to Measure</h2>
          <p><strong>Bust:</strong> around the fullest part of your chest, keeping the tape level.</p>
          <p><strong>Waist:</strong> around the narrowest part of your waist.</p>
          <p><strong>Hips:</strong> around the fullest part of your hips.</p>
        </section>

        <section>
          <h2>Between Sizes?</h2>
          <p>For a relaxed fit choose the larger size; for a closer fit choose the smaller one.</p>
        </section>
      </div>
    </div>
  );
}

export default SizeGuide;
