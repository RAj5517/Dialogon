import './FancyButton.css';

const FancyButton = ({ children, onClick }) => {
  return (
    <button className="fancy-button" onClick={onClick}>
      {children}
    </button>
  );
};

export default FancyButton;