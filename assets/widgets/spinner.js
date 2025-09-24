// assets/widgets/spinner.js
export function createSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.innerHTML = `
    <style>
      .spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  return spinner;
}
