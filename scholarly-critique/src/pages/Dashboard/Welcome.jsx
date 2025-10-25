import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import './welcome.css';
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";
import { FaFileAlt, FaCloudUploadAlt, FaThumbsUp } from 'react-icons/fa';

const Welcome = () => {
  return (
    <div className="welcome-container">
      {/* Header */}
      <header className="welcome-header">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo-image" />
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
        
        <nav className="nav-links">
          <HashLink smooth to="/welcome#how-it-works">
    How It Works
  </HashLink>
          <Link to="/topics">Topics</Link>
          <Link to="/faq">FAQ</Link>
        

        <div className="auth-buttons">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn">Sign Up</Link>
        </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
      
        <div className="hero-content">
          <h2>Peer Feedback that Improves your Essays</h2>
          <p>
            Every writer needs feedback on their essays. Upload your paper, get reviewed by other college students like you, and return the favor to earn credits.
          </p>
          <Link to="/login" className="cta-button">Start Critiquing</Link>
        </div>
      </section>

      {/* How it Works Section */}
       <section id="how-it-works" className="howitworks-section">
     <h3 className="howitworks-heading"><strong>How it Works</strong></h3>
     <div className="howitworks-icons">
      <div className="howitworks-item">
        <FaFileAlt className="howitworks-icon" />
         <p>
          Review other students’ essays to earn credits. Every 500 words
           (rounded up) will earn you 1 credit.
         </p>
      </div>

       <div className="howitworks-item">
         <FaCloudUploadAlt className="howitworks-icon" />
         <p>
           Use your credits to upload your own essays and get feedback.
          Each credit allows you to upload up to 500 words of your paper.
        </p>
       </div>

       <div className="howitworks-item">
         <FaThumbsUp className="howitworks-icon" />
         <p>
           Rate critiques, get rated, improve, and repeat.
         </p>
       </div>
     </div>
   </section>

      {/* Origin Story */}
      <section className='origin-section'>
        <p>
          <strong>How ScholarlyCritique was Born.</strong> ScholarlyCritique was founded by two college students who recognized a common problem. While academic writing is central to student success, getting meaningful, timely feedback is often difficult. Professors and writing centers can offer support, but low accessibility and time constraints can leave students without the input they need, especially when deadlines are near.
          <br /><br />
          Turning the problem into an opportunity, we asked ourselves "what if there was a platform where college students could exchange feedback with others in a structured, constructive, and completely peer-driven way?"
          <br /><br />
          From this, ScholarlyCritique was born.
          <br /><br />
          Our mission was clear: to build a collaborative space where students could earn feedback by giving it, grow as writers through community engagement, and take control over their learning.
          <br /><br />
          Today, ScholarlyCritique is a platform powered by students, for students. Whether you're writing a first draft, refining a final draft, or learning through reviewing others’ work, ScholarlyCritique offers a structured community built on shared growth, academic integrity, and mutual support.
        </p>
      </section>
      <footer className="text-xs text-gray-500 text-center mt-10">&copy; {new Date().getFullYear()} ScholarlyCritique. All rights reserved.</footer>
    </div>
  );
};

export default Welcome;
