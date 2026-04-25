import React from 'react';

const Loader = ({ size = 1, color = '#10b981' }) => {
  const wrapperStyle = {
    '--loader-color': color,
    '--loader-color-soft': `${color}66`,
    '--loader-color-faint': `${color}1a`,
  };

  const socketSize = 200 * size;
  const gelSize = 30 * size;
  const brickWidth = 30 * size;
  const brickHeight = 17 * size;
  const brickTop = 5 * size;
  const centerMargin = -15 * size;

  const getPosition = (col) => {
    const positions = {
      1: { l: -47, t: -15 }, 2: { l: -31, t: -43 }, 3: { l: 1, t: -43 },
      4: { l: 17, t: -15 }, 5: { l: -31, t: 13 }, 6: { l: 1, t: 13 },
      7: { l: -63, t: -43 }, 8: { l: 33, t: -43 }, 9: { l: -15, t: 41 },
      10: { l: -63, t: 13 }, 11: { l: 33, t: 13 }, 12: { l: -15, t: -71 },
      13: { l: -47, t: -71 }, 14: { l: 17, t: -71 }, 15: { l: -47, t: 41 },
      16: { l: 17, t: 41 }, 17: { l: -79, t: -15 }, 18: { l: 49, t: -15 },
      19: { l: -63, t: -99 }, 20: { l: 33, t: -99 }, 21: { l: 1, t: -99 },
      22: { l: -31, t: -99 }, 23: { l: -63, t: 69 }, 24: { l: 33, t: 69 },
      25: { l: 1, t: 69 }, 26: { l: -31, t: 69 }, 28: { l: -95, t: -43 },
      29: { l: -95, t: 13 }, 30: { l: 49, t: 41 }, 31: { l: -79, t: -71 },
      32: { l: -111, t: -15 }, 33: { l: 65, t: -43 }, 34: { l: 65, t: 13 },
      35: { l: -79, t: 41 }, 36: { l: 49, t: -71 }, 37: { l: 81, t: -15 },
    };
    const pos = positions[col] || { l: 0, t: 0 };
    return {
      marginLeft: pos.l * size,
      marginTop: pos.t * size,
    };
  };

  const BrickGroup = () => (
    <>
      <div className="net-hex-brick" style={{ width: brickWidth, height: brickHeight, top: brickTop }} />
      <div className="net-hex-brick net-h2" style={{ width: brickWidth, height: brickHeight, top: brickTop }} />
      <div className="net-hex-brick net-h3" style={{ width: brickWidth, height: brickHeight, top: brickTop }} />
    </>
  );

  return (
    <div className="net-loader-wrapper" style={wrapperStyle}>
      <div className="net-socket" style={{ width: socketSize, height: socketSize }}>
        <div className="net-gel net-center-gel" style={{ height: gelSize, width: gelSize, marginLeft: centerMargin, marginTop: centerMargin }}>
          <BrickGroup />
        </div>
        {[...Array(37)].map((_, i) => {
          const col = i + 1;
          if (col === 27) return null;
          const row = col <= 6 ? 1 : col <= 18 ? 2 : 3;
          return (
            <div 
              key={col} 
              className={`net-gel c${col} net-r${row}`}
              style={{ height: gelSize, width: gelSize, ...getPosition(col) }}
            >
              <BrickGroup />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Loader;
