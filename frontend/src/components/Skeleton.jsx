import React from 'react';

const Skeleton = ({ height = 16 }) => (
  <div
    style={{
      height,
      width: '100%',
      borderRadius: 12,
      background: 'linear-gradient(90deg, #eef2ff 25%, #e2e8f0 37%, #eef2ff 63%)',
      backgroundSize: '400% 100%',
      animation: 'skeleton-loading 1.4s ease infinite',
    }}
  />
);

export default Skeleton;
