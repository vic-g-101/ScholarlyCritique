import React from 'react';
import { Link } from 'react-router-dom';
import './faq.css';
import logo from '../../assets/images/FinalScholarlyCritiqueLogo.png';


const faqs = [
  {
    question: 'What is ScholarlyCritique?',
    answer:
      'ScholarlyCritique is a platform where college students can receive peer feedback on their academic essays. Review other students’ work to earn credits, then spend them to upload your own essays for review.'
  },
  {
    question: 'How do I earn credits?',
    answer:
      'You earn 1 credit for every 500 words you review (rounded up). Review more essays to accumulate credits you can use to upload your own work.'
  },
  {
    question: 'Are there any requirements for writing reviews?',
    answer:
      'We just ask that you be thorough and constructive in your feedback. You’re not required to have a minimum rating to stay active on the site.'
  },
  {
    question: 'How many essays can I upload?',
    answer:
      'You can upload as many essays as you like, as long as you have enough credits. The more credits you earn, the more essays you can submit for review.'
  },
  {
    question: 'Can I edit my essay after it’s been uploaded?',
    answer:
      'Yes, you can make changes to your essay once it has been uploaded, but keep in mind that reviewers might have already begun their critiques if you do.'
  }
];

export default function Faq() {
  return (
    <div className="faq-container">
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
        <nav className="nav-links">
          <Link to="/welcome#how-it-works">How It Works</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/faq" className="active">FAQ</Link>
        
        <div className="auth-buttons">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn">Sign Up</Link>
        </div>
        </nav>
      </header>

      {/* — FAQ Content — */}
      <main className="faq-main">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {faqs.map(({ question, answer }) => (
            <div key={question} className="faq-item">
              <h4>{question}</h4>
              <p>{answer}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}