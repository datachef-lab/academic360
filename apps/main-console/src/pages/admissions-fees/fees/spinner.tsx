import React from "react";

const DotSpinnerLoader: React.FC = () => (
  <>
    <div className="flex items-center justify-center py-8">
      <div className="dot-spinner" role="status" aria-label="Loading mappings">
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
      </div>
    </div>

    <style>{`
      .dot-spinner {
        --uib-size: 2.8rem;
        --uib-speed: 0.9s;
        --uib-color: #183153;

        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: var(--uib-size);
        height: var(--uib-size);
      }

      .dot-spinner__dot {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .dot-spinner__dot::before {
        content: "";
        width: 20%;
        height: 20%;
        border-radius: 50%;
        background: var(--uib-color);
        transform: scale(0);
        opacity: 0.5;
        box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
        animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
      }

      .dot-spinner__dot:nth-child(2) {
        transform: rotate(45deg);
      }

      .dot-spinner__dot:nth-child(2)::before {
        animation-delay: calc(var(--uib-speed) * -0.875);
      }

      .dot-spinner__dot:nth-child(3) {
        transform: rotate(90deg);
      }

      .dot-spinner__dot:nth-child(3)::before {
        animation-delay: calc(var(--uib-speed) * -0.75);
      }

      .dot-spinner__dot:nth-child(4) {
        transform: rotate(135deg);
      }

      .dot-spinner__dot:nth-child(4)::before {
        animation-delay: calc(var(--uib-speed) * -0.625);
      }

      .dot-spinner__dot:nth-child(5) {
        transform: rotate(180deg);
      }

      .dot-spinner__dot:nth-child(5)::before {
        animation-delay: calc(var(--uib-speed) * -0.5);
      }

      .dot-spinner__dot:nth-child(6) {
        transform: rotate(225deg);
      }

      .dot-spinner__dot:nth-child(6)::before {
        animation-delay: calc(var(--uib-speed) * -0.375);
      }

      .dot-spinner__dot:nth-child(7) {
        transform: rotate(270deg);
      }

      .dot-spinner__dot:nth-child(7)::before {
        animation-delay: calc(var(--uib-speed) * -0.25);
      }

      .dot-spinner__dot:nth-child(8) {
        transform: rotate(315deg);
      }

      .dot-spinner__dot:nth-child(8)::before {
        animation-delay: calc(var(--uib-speed) * -0.125);
      }

      @keyframes pulse0112 {
        0%,
        100% {
          transform: scale(0);
          opacity: 0.5;
        }

        50% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `}</style>
  </>
);

export default DotSpinnerLoader;
