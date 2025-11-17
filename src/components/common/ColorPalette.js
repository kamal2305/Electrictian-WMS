import React from 'react';
import './ColorPalette.css';

const ColorPalette = () => {  const githubColors = [
    {
      name: 'Primary',
      hex: '#6c7883',
      rgb: 'rgb(108, 120, 131)',
      hsl: 'hsl(210, 10%, 47%)',
      class: 'github-primary'
    },
    {
      name: 'Secondary',
      hex: '#5d6771',
      rgb: 'rgb(93, 103, 113)',
      hsl: 'hsl(210, 10%, 40%)',
      class: 'github-secondary'
    },
    {
      name: 'Accent',
      hex: '#4e5760',
      rgb: 'rgb(78, 87, 96)',
      hsl: 'hsl(210, 10%, 34%)',
      class: 'github-accent'
    },
    {
      name: 'Muted',
      hex: '#40484f',
      rgb: 'rgb(64, 72, 79)',
      hsl: 'hsl(210, 10%, 28%)',
      class: 'github-muted'
    },
    {
      name: 'Dark',
      hex: '#32393f',
      rgb: 'rgb(50, 57, 63)',
      hsl: 'hsl(210, 11%, 22%)',
      class: 'github-dark'
    },
    {
      name: 'Darker',
      hex: '#252a2f',
      rgb: 'rgb(37, 42, 47)',
      hsl: 'hsl(210, 12%, 16%)',
      class: 'github-darker'
    },
    {
      name: 'Darkest',
      hex: '#191d20',
      rgb: 'rgb(25, 29, 32)',
      hsl: 'hsl(210, 12%, 11%)',
      class: 'github-darkest'
    },    {
      name: 'Black',
      hex: '#040506',
      rgb: 'rgb(4, 5, 6)',
      hsl: 'hsl(210, 20%, 2%)',
      class: 'github-black'
    },
    {
      name: 'Near Black',
      hex: '#000101',
      rgb: 'rgb(0, 1, 1)',
      hsl: 'hsl(180, 100%, 0.2%)',
      class: 'github-near-black'
    }
  ];

  return (
    <div className="color-palette-container">
      <h2>GitHub Color Palette</h2>
      <div className="color-palette">
        {githubColors.map((color, index) => (
          <div key={index} className={`color-swatch ${color.class}`}>
            <div className="color-display"></div>
            <div className="color-info">
              <div className="color-name">{color.name}</div>
              <div className="color-value">{color.hex}</div>
              <div className="color-value">{color.rgb}</div>
              <div className="color-value">{color.hsl}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;