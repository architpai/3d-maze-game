import { useState } from 'react';
import './Tutorial.css';

const TUTORIAL_STEPS = [
  {
    id: 'movement',
    icon: '🕹️',
    title: 'Movement',
    description: 'Use WASD or Arrow keys to move through the maze.',
    hint: 'On mobile, tap and drag anywhere to use the virtual joystick.',
  },
  {
    id: 'modifiers',
    icon: '✨',
    title: 'Power-Ups',
    description: 'Collect glowing orbs to gain special abilities!',
    items: [
      { icon: '⚡', name: 'Speed Boost', desc: 'Move 2.5x faster for 10 seconds', color: '#00ffff' },
      { icon: '🦘', name: 'Jump', desc: 'Gain 3 jumps in 5 seconds', color: '#00ff00' },
      { icon: '🔮', name: 'Wisp', desc: 'Reveals path to the exit', color: '#ffd700' },
    ],
  },
  {
    id: 'objective',
    icon: '🎯',
    title: 'Find the Exit',
    description: 'Navigate to the golden glowing portal to win!',
    hint: 'The exit is placed far from your starting position. Explore carefully!',
  },
];

/**
 * Tutorial component with step-by-step guidance
 */
export function Tutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        {/* Progress dots */}
        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="tutorial-step" key={step.id}>
          <div className="step-icon">{step.icon}</div>
          <h2 className="step-title">{step.title}</h2>
          <p className="step-desc">{step.description}</p>

          {/* Modifier items for power-ups step */}
          {step.items && (
            <div className="modifier-list">
              {step.items.map((item, i) => (
                <div key={i} className="modifier-item" style={{ '--mod-color': item.color }}>
                  <span className="mod-icon">{item.icon}</span>
                  <div className="mod-info">
                    <span className="mod-name">{item.name}</span>
                    <span className="mod-desc">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step.hint && <p className="step-hint">💡 {step.hint}</p>}
        </div>

        {/* Navigation */}
        <div className="tutorial-nav">
          <button
            className="nav-btn nav-btn-secondary"
            onClick={onSkip}
          >
            Skip
          </button>
          <div className="nav-main">
            {currentStep > 0 && (
              <button className="nav-btn nav-btn-ghost" onClick={handlePrev}>
                ← Back
              </button>
            )}
            <button className="nav-btn nav-btn-primary" onClick={handleNext}>
              {isLastStep ? "Let's Play! 🎮" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
