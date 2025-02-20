import PropTypes from 'prop-types';

export const Input = ({ className, type, error, ...props }) => {
  const styles = {
    width: '100%',
    padding: '0.75rem',
    background: '#2a2a2a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease'
  };

  return (
    <input
      type={type}
      style={styles}
      className={`input-field ${error ? 'input-error' : ''} ${className || ''}`}
      {...props}
    />
  );
};

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.bool
};