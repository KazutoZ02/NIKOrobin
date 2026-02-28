import { motion } from 'framer-motion';

const teamMembers = [
  {
    name: 'Royal D Subro',
    role: 'Founder',
    games: ['Genshin Impact', 'WuWa', 'Honkai Star Rail'],
    avatar: '/images/founder.jpg',
    discord: 'royald_subro',
    quote: 'Building dreams into reality, one service at a time.'
  },
  {
    name: 'Kazuto ;)',
    role: 'Owner',
    games: ['Honkai Star Rail', 'Dragon Ball Legends'],
    avatar: '/images/owner.jpg',
    discord: 'kazuto_official',
    quote: 'Excellence is not a destination, but a continuous journey.'
  }
];

const games = [
  {
    name: 'Genshin Impact',
    image: '/images/genshin.jpg',
    description: 'Explore the vast world of Teyvat with our premium exploration services.',
    rating: 5,
    active: true
  },
  {
    name: 'Honkai Star Rail',
    image: '/images/hsr.jpg',
    description: 'Embark on a journey across the stars with expert guidance.',
    rating: 5,
    active: true
  },
  {
    name: 'Wuthering Waves',
    image: '/images/wuwa.jpg',
    description: 'Discover the mysteries of the new open-world adventure.',
    rating: 4.5,
    active: true
  },
  {
    name: 'Dragon Ball Legends',
    image: '/images/dbl.jpg',
    description: 'Master the art of combat with our legendary support services.',
    rating: 4,
    active: true
  }
];

const About = () => {
  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <section className="team-section">
        <motion.h2 
          className="section-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Meet Our <span className="gradient-text">Team</span>
        </motion.h2>
        
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              className="team-card glass-card"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="team-avatar-container">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="team-avatar"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`;
                  }}
                />
                <div className="avatar-glow"></div>
              </div>
              
              <h3 className="team-name">{member.name}</h3>
              <span className="team-role">{member.role}</span>
              
              <div className="team-games">
                {member.games.map(game => (
                  <span key={game} className="game-tag">{game}</span>
                ))}
              </div>
              
              <p className="team-quote">"{member.quote}"</p>
              
              <a 
                href={`https://discord.com/users/${member.discord}`}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Discord Profile
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="games-section">
        <motion.h2 
          className="section-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Our <span className="gradient-text">Games</span>
        </motion.h2>
        
        <div className="games-grid">
          {games.map((game, index) => (
            <motion.div
              key={game.name}
              className="game-card glass-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.03, y: -8 }}
            >
              <div className="game-banner">
                <img 
                  src={game.image} 
                  alt={game.name}
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${game.name}`;
                  }}
                />
                {game.active && <span className="active-badge">Active</span>}
              </div>
              
              <div className="game-info">
                <h3 className="game-title">{game.name}</h3>
                <p className="game-description">{game.description}</p>
                
                <div className="game-rating">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill={i < Math.floor(game.rating) ? "currentColor" : "none"}
                      stroke="currentColor" 
                      strokeWidth="2"
                      className={i >= Math.floor(game.rating) && game.rating % 1 !== 0 ? 'half-star' : ''}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                  <span className="rating-value">{game.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default About;
