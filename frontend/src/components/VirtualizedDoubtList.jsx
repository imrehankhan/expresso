import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { FaThumbsUp, FaClock } from 'react-icons/fa';

const VirtualizedDoubtList = ({ doubts }) => {
  const Row = ({ index, style }) => {
    const doubt = doubts[index];
    return (
      <motion.div
        key={doubt.id}
        style={style}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-500 shadow-lg backdrop-blur-sm`}
      >
        <div className='flex flex-col gap-6'>
          <div className='flex items-start gap-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-lg'>
              {doubt.user.charAt(0).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-white text-xl leading-relaxed mb-4 font-medium'>
                {doubt.text}
              </p>
              <div className='flex flex-wrap items-center gap-6 text-sm text-gray-300'>
                <div className='flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full'>
                  <span className='font-bold'>{doubt.upvotes || 0}</span>
                </div>
                <span className='flex items-center gap-2'>
                  <FaClock className='text-sm' />
                  {new Date(doubt.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  return (
    <List
      height={400} // Adjust height as needed
      itemCount={doubts.length}
      itemSize={100} // Adjust item size as needed
      width="100%"
    >
      {Row}
    </List>
  );
};
export default VirtualizedDoubtList;