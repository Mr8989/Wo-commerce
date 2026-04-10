import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import './About.css';

function About() {
  // Admin location - Update these coordinates to your actual location
  const adminLocation = {
    lat: 6.59766985567141, // Accra, Ghana latitude
    lng: 0.48451288301618783, // Accra, Ghana longitude
    address: "UHAS Campus, Ho, Ghana",
    city: "Ho",
    country: "Ghana"
  };

  return (
    <div className="about-page container fade-in">
      <div className="about-hero">
        <h1>About Cropped By Ayerkie</h1>
        <p>Your destination for elegant women's fashion</p>
      </div>

      <div className="about-content">
        <section className="about-story">
          <h2>Our Story</h2>
          <p>
            Cropped By Ayerkie was founded with a simple mission: to provide women with beautiful, 
            high-quality fashion that celebrates their unique style and confidence. 
            We carefully curate each piece in our collection, ensuring that every item 
            meets our standards for quality, style, and elegance.
          </p>
          <p>
            From timeless classics to contemporary trends, we offer a diverse range 
            of clothing that empowers women to express themselves through fashion. 
            Our commitment is to make every woman feel beautiful, confident, and special.
          </p>
        </section>

        <section className="about-values">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3> Quality First</h3>
              <p>Every piece is carefully selected for its craftsmanship and durability</p>
            </div>
            <div className="value-item">
              <h3> Customer Care</h3>
              <p>Your satisfaction is our priority. We're here to help every step of the way</p>
            </div>
            <div className="value-item">
              <h3> Style Diversity</h3>
              <p>Fashion for every woman, every occasion, every style</p>
            </div>
            <div className="value-item">
              <h3> Trust & Transparency</h3>
              <p>Honest pricing, clear policies, and reliable service</p>
            </div>
          </div>
        </section>

        <section className="about-location">
          <h2>Visit Our Store</h2>
          <p>Come see our collection in person! We'd love to welcome you.</p>
          
          <div className="location-content">
            <div className="location-info">
              <div className="info-item">
                <MapPin size={24} />
                <div>
                  <h4>Address</h4>
                  <p>{adminLocation.address}</p>
                  <p>{adminLocation.city}, {adminLocation.country}</p>
                </div>
              </div>

              <div className="info-item">
                <Phone size={24} />
                <div>
                  <h4>Phone</h4>
                  <p>+233 54 489 3583</p>
                  <p>+233 54 489 3583</p>
                </div>
              </div>

              <div className="info-item">
                <Mail size={24} />
                <div>
                  <h4>Email</h4>
                  <p>odjerflorence610@gmail.com</p>
                  <p></p>
                </div>
              </div>

              <div className="info-item">
                <Clock size={24} />
                <div>
                  <h4>Business Hours</h4>
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="location-map">
              <iframe
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: '12px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${adminLocation.lat},${adminLocation.lng}&zoom=15`}
              />
              <p className="map-note">
                📍 Click the map to get directions in Google Maps
              </p>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <h2>Ready to Shop?</h2>
          <p>Explore our latest collection and find your perfect style</p>
          <a href="/shop" className="btn btn-primary">Browse Collection</a>
        </section>
      </div>
    </div>
  );
}

export default About;
