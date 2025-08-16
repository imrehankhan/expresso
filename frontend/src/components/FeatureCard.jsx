import React from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({
  icon,
  title,
  description,
  gradient = 'from-purple-500 to-blue-500',
  delay = 0,
  onClick,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      className={`group relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-xl ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? "button" : "article"}
      aria-label={`${title}: ${description}`}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl" />
      
      {/* Hover effect overlay */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
      />
      
      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">
        {/* Icon */}
        <motion.div
          className="mb-4"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-lg`}>
            {icon}
          </div>
        </motion.div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed flex-grow">
          {description}
        </p>
        
        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-transparent"
          whileHover={{
            borderImage: `linear-gradient(45deg, transparent, rgba(147, 51, 234, 0.5), transparent) 1`,
          }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </motion.div>
  );
};

export const FeatureShowcase = ({ features = [] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          {...feature}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
};

export const InteractiveFeatureCard = ({ 
  icon, 
  title, 
  description, 
  stats,
  gradient = 'from-purple-500 to-blue-500',
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="relative group"
    >
      {/* Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mr-3`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        
        {/* Description */}
        <p className="text-gray-300 text-sm mb-4">{description}</p>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <motion.div
                  className="text-2xl font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.3 + index * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
