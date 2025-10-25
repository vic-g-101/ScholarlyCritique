import React from 'react';
import { Link } from 'react-router-dom';
import './topics.css';
import logo from '../../assets/images/FinalScholarlyCritiqueLogo.png';

const topics = [
  {
    title: 'Humanities',
    desc: 'This section includes essays exploring philosophy, history, literature, linguistics, anthropology, culture, and more. If you are interested in analyzing a historical event, exploring the nuances of an ethical dilemma, learning about grand ideas, or learning how cultures blend and evolve together over time, this is the section for you.'
  },
  {
    title: 'Social Science',
    desc: 'If you are interested in reading an essay that explores psychology, sociology, political science, international relations, or related sujects, this is the section for you. These essays typically include empirical data, academic research, theoretical data, or case studies to explain and explore real world patterns and problems. '
  },
  {
    title: 'Argumentative & Rhetorical Essays',
    desc: 'This section is all about persusion and personal voice. If you are writing a college application essay, a personal statement, or making a case in a persuasive or opinion piece, this is the section for you. The essays in this section are meant to connect with the reader and get your point across. Often blending personal experience with strong structure and word choice, these essays reflect strong persuasion. '
  },
  {
    title: 'Media Writing',
    desc: 'This space is for all media-related writing. This includes essays such as news articles, journalism, film reviews, and podcast scripts. It also includes essays analyzing TV shows, news, social platforms, etc. If your work involves discussing how stories are told or how media shapes public opinion or society, it belongs here. If you are looking to read current events or real world events that happened recently, this is the place for you.'
  },
  {
    title: 'Creative Writing',
    desc: 'This topic is for storytelling. This could be storytelling, poetry, personal narratives, potential TV scripts, and more. This section is meant to evoke imagination, emotion, and voice. The structutre is less strict with a stronger emphasis on flow and expression. If you want to read/write a piece about coming-of-age, novel writing, or personal expression, Creative Writing is what you are looking for.'
  },
  {
    title: 'Business & Law',
    desc: 'This section is for essays that delve into the world of buisness and law. This range could be anything from case studies, legal anlaysis, buisness ethics, contracts, to stock news, and more. Any writing piece for pre-law, econ, or buisness courses belongs here. If you are looking to read/write a policy memo, a piece on company strategy, or court precedent, this is the topic to search in.'
  },
  {
    title: 'STEM',
    desc: 'While STEM students are known for not having to do a lot of writing, this section has some of the most interesting pieces to read. This section can contain research summaries, lab experiment results, the impact of new tech, the impact of scientific breakthroughs, and more. Characterized by its use of empirical evidence, this section has a lot to offer. '
  },
  {
    title: 'Interdisciplinary',
    desc: 'Not every essay fits neatly into just one category. While we eoncourage writiers to fit their essays into a topic as best as possible, sometimes the topics listed do not do the writing justice. The interdisciplinary section is made specifically for pieces like this, that do not fit cleanly into one of the other topics. If you are really not sure what you want to read and are just looking for something interesting, this is the section.'
  },
];

export default function Topics() {
  return (
    <div className="topics-container">
      {/* Header (same as Welcome) */}
      <header className="welcome-header">
        <div className="logo-section">
          <Link to="/welcome">
            <img src={logo} alt="Logo" className="logo-image" />
          </Link>
          <h1 className="logo-text">ScholarlyCritique</h1>
        </div>
        <nav className="nav-links">
          <Link to="/welcome#how-it-works">How It Works</Link>
          <Link to="/topics" className="active">Topics</Link>
          <Link to="/faq">FAQ</Link>
        
        <div className="auth-buttons">
          <Link to="/login" className="btn">Login</Link>
          <Link to="/signup" className="btn">Sign Up</Link>
        </div>
        </nav>
      </header>

      {/* Topics Grid */}
      <main className="topics-grid">
        {topics.map((t) => (
          <div key={t.title} className="topic-card">
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
