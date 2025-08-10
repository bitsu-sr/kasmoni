import React from 'react';

const ToggleSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`toggle-switch-container ${className}`}>
      <label className="toggle-switch-label">
        <span className="toggle-switch-text">{label}</span>
        <div className="toggle-switch-wrapper">
          <input
            type="checkbox"
            className="toggle-switch-input"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          <span className={`toggle-switch-slider ${checked ? 'checked' : ''}`}>
            <span className="toggle-switch-thumb"></span>
            <span className="toggle-switch-text-on">ON</span>
            <span className="toggle-switch-text-off">OFF</span>
          </span>
        </div>
      </label>
    </div>
  );
};

export default ToggleSwitch;
