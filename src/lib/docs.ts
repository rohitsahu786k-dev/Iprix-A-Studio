export type DocumentationGuide = {
  slug: string;
  step: string;
  title: string;
  summary: string;
  duration: string;
  outcome: string;
  steps: Array<{ title: string; detail: string }>;
  tips: string[];
};

export const documentationGuides: DocumentationGuide[] = [
  {
    slug: "install-extension",
    step: "01",
    title: "Install the A+ Studio extension",
    summary: "Add the extension to Chrome, pin it to the toolbar and confirm the dashboard handshake.",
    duration: "3 min",
    outcome: "Your browser is ready to capture templates and autofill marketplace forms.",
    steps: [
      { title: "Open the extension package", detail: "Download the latest A+ Studio extension build from your dashboard or use the approved Chrome Web Store listing when available." },
      { title: "Add it to Chrome", detail: "Open chrome://extensions, enable Developer mode, choose Load unpacked and select the extracted extension folder." },
      { title: "Pin A+ Studio", detail: "Open Chrome's Extensions menu and pin A+ Studio so template and autofill actions stay one click away." },
      { title: "Verify the connection", detail: "Refresh the A+ Studio dashboard. The header status changes to Extension connected after the secure page handshake succeeds." },
    ],
    tips: ["Only install builds supplied by Iprix Media.", "If the status is not detected, refresh both Chrome and the dashboard tab once."],
  },
  {
    slug: "login-connect",
    step: "02",
    title: "Sign in and connect your workspace",
    summary: "Authorize the extension with the same A+ Studio account used in your seller dashboard.",
    duration: "2 min",
    outcome: "Templates, listings and account limits can sync securely between the dashboard and extension.",
    steps: [
      { title: "Open the extension", detail: "Select the A+ Studio icon in Chrome and choose Sign in when the connection screen appears." },
      { title: "Use your A+ Studio account", detail: "Enter the email and password registered at aplusstudio.iprixmedia.com. Credentials are sent only to the production A+ Studio API." },
      { title: "Confirm your workspace", detail: "Check the displayed account name and plan, then approve the connection." },
      { title: "Run a status check", detail: "Return to the dashboard and select the extension status button to repeat the live connection check." },
    ],
    tips: ["Use one workspace per seller team for consistent templates.", "Never share your password with a marketplace operator."],
  },
  {
    slug: "save-template",
    step: "03",
    title: "Capture a reusable listing template",
    summary: "Scan a completed Meesho form and save its fields as a reusable, editable template.",
    duration: "5 min",
    outcome: "Repeated catalog attributes can be restored without entering every value again.",
    steps: [
      { title: "Open a completed listing form", detail: "Use a listing that already contains correct category, size, price and product attributes. Do not submit it during capture." },
      { title: "Scan the form", detail: "Open A+ Studio and choose Scan form. Review the detected text fields, dropdowns, chips, checkboxes and image slots." },
      { title: "Remove unwanted values", detail: "Exclude one-off details such as a unique SKU or price when those values should come from the product record instead." },
      { title: "Name and save", detail: "Use a clear category-based name, select the marketplace and save. The template appears immediately in Dashboard → Templates." },
    ],
    tips: ["Create separate templates for materially different categories.", "Review captured prices before reusing a template."],
  },
  {
    slug: "autofill-preview",
    step: "04",
    title: "Autofill with preview and review",
    summary: "Preview every value, fill the marketplace form and manually approve the final submission.",
    duration: "4 min",
    outcome: "A marketplace form is populated quickly while you retain final control over every field.",
    steps: [
      { title: "Open the target form", detail: "Navigate to a supported Meesho or Flipkart seller listing page and keep the tab active." },
      { title: "Choose a listing or template", detail: "Select the saved source in the extension. Product-specific data takes priority over reusable template defaults." },
      { title: "Review the preview", detail: "Confirm title, price, description, sizes, attributes and images. Resolve any missing-field warnings before filling." },
      { title: "Fill, verify and submit yourself", detail: "Run Autofill, inspect the completed marketplace form and use the marketplace's submit button only after your final check." },
    ],
    tips: ["A+ Studio does not auto-submit seller forms.", "Always confirm price, tax, inventory and shipping attributes."],
  },
  {
    slug: "ai-content",
    step: "05",
    title: "Create marketplace-ready AI content",
    summary: "Generate titles, descriptions, bullets, SKUs and keyword groups from verified product inputs.",
    duration: "6 min",
    outcome: "You receive editable listing copy plus quality and marketplace-readiness scores.",
    steps: [
      { title: "Add accurate product basics", detail: "Enter the product name, brand, category, material, colour, size and only the features you can verify." },
      { title: "Select the marketplace", detail: "Choose Meesho, Flipkart or Amazon so copy length and structure match the target workflow." },
      { title: "Generate and review", detail: "Check every claim, keyword and care instruction. Edit the output directly before saving it." },
      { title: "Save to the right destination", detail: "Save as a listing, create a product record, turn it into a reusable template or send it to the extension." },
    ],
    tips: ["Never publish an AI-generated claim you cannot prove.", "Use Keyword Explorer before generation for stronger buyer-intent phrases."],
  },
  {
    slug: "optimize-images",
    step: "06",
    title: "Optimize listing images and shipping presentation",
    summary: "Check image compliance, create a clean square canvas and compare low-shipping presentation variants.",
    duration: "5 min",
    outcome: "Your primary product image is clearer, marketplace-ready and less likely to exaggerate perceived bulk.",
    steps: [
      { title: "Run the image checker", detail: "Validate dimensions, square ratio, brightness and background before uploading a product image." },
      { title: "Create the 1000×1000 output", detail: "Use Image Maker for a clean marketplace canvas while keeping product proportions truthful." },
      { title: "Compare low-shipping variants", detail: "Generate compactness options and review the Perceived Bulk Score. The physical product and quantity must remain unchanged." },
      { title: "Test in the supplier panel", detail: "Upload the selected image, review the marketplace shipping quote and keep the clearest compliant variant." },
    ],
    tips: ["Do not hide accessories or alter the quantity sold.", "Keep source images for audit and future marketplace updates."],
  },
];

export function getDocumentationGuide(slug: string) {
  return documentationGuides.find((guide) => guide.slug === slug);
}
