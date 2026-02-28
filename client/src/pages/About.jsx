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
      transition={{
