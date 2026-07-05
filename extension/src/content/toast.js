/* A+ Studio content-script module — in-page toast notifications. */

  export function showToast(message, type = "info") {
    const existing = document.getElementById("__listify_toast__");
    if (existing) existing.remove();

    const colors = {
      success: "#1a9e5a",
      error: "#dc2626",
      warning: "#d97706",
      info: "#09090b",
      off: "#6b7280",
    };

    const toast = document.createElement("div");
    toast.id = "__listify_toast__";

    // Use setProperty with 'important' for layout styles so page CSS cannot override.
    // opacity and transform are set WITHOUT !important so requestAnimationFrame
    // and setTimeout can update them freely for the slide-in/out animation.
    const s = toast.style;
    s.setProperty("position", "fixed", "important");
    s.setProperty("top", "20px", "important");
    s.setProperty("right", "20px", "important");
    s.setProperty("z-index", "2147483647", "important");
    s.setProperty("display", "flex", "important");
    s.setProperty("align-items", "center", "important");
    s.setProperty("gap", "8px", "important");
    s.setProperty("background", colors[type] || colors.info, "important");
    s.setProperty("color", "#fff", "important");
    s.setProperty("padding", "11px 16px", "important");
    s.setProperty("border-radius", "10px", "important");
    s.setProperty(
      "font-family",
      "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "important",
    );
    s.setProperty("font-size", "13px", "important");
    s.setProperty("font-weight", "500", "important");
    s.setProperty("line-height", "1.4", "important");
    s.setProperty("box-shadow", "0 4px 24px rgba(0,0,0,0.22)", "important");
    s.setProperty("max-width", "320px", "important");
    s.setProperty("pointer-events", "none", "important");
    s.setProperty(
      "transition",
      "opacity 0.22s ease, transform 0.22s ease",
      "important",
    );
    // Animation start state — plain assignment so animation can update them
    s.opacity = "0";
    s.transform = "translateY(-10px)";

    const brand = document.createElement("span");
    brand.setAttribute(
      "style",
      "font-weight:700;font-size:11px;opacity:0.85;white-space:nowrap;letter-spacing:0.03em;",
    );
    brand.textContent = "A+ Studio";

    const dot = document.createElement("span");
    dot.setAttribute("style", "opacity:0.4;margin:0 2px;");
    dot.textContent = "·";

    const text = document.createElement("span");
    text.setAttribute(
      "style",
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
    );
    text.textContent = message;

    toast.appendChild(brand);
    toast.appendChild(dot);
    toast.appendChild(text);
    document.body.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Slide out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 280);
    }, 3500);
  }
