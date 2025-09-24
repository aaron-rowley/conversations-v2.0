export function mountToaster() {
  const container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);

  return (msg, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => container.removeChild(toast), 3000);
  };
}
