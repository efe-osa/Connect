import React from 'react';

const Skeleton = () => {
  return (
    <div className='skeleton'>
      <div className='skeleton__avatar' />
      <div className='skeleton__author' />
      <div className='skeleton__details' />
    </div>
  );
};

export default Skeleton;
