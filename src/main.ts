import './styles/global.css';
import './styles/app.css';
import './styles/landing.css';
import {
  type ArtworkDetails,
  type Currency,
  type PriceCalculation,
  CAREER_STAGE_LABELS,
  EDUCATION_LABELS,
  SALES_RANGE_LABELS,
  MEDIUM_LABELS
} from './types/artwork';
import {
  calculatePrice,
  formatCurrency,
  formatPriceRange,
  fetchExchangeRate
} from './utils/priceCalculator';
import { generatePDF } from './utils/pdfExport';

// ===== State =====
type View = 'landing' | 'calculator';
let currentView: View = 'landing';
let currentCurrency: Currency = 'USD';
let exchangeRate = 1.36;
let exchangeRateDate = '';
let currentCalculation: PriceCalculation | null = null;
let artworkImageDataUrl: string | null = null;

// ===== Initialize =====
async function init() {
  renderApp();
  setupEventListeners();

  // Fetch exchange rate
  const rateData = await fetchExchangeRate();
  exchangeRate = rateData.rate;
  exchangeRateDate = rateData.date;
  updateExchangeRateDisplay();
}

function renderApp() {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="app">
      <header class="header">
        <div class="container">
          <div class="header-content">
            <div class="logo cursor-pointer" id="navLogo">
              <span class="logo-icon">☕</span>
              <span class="logo-text">Artpresso</span>
            </div>
            <p class="tagline">Brew a price. Serve it confidently.</p>
          </div>
        </div>
      </header>

      <main class="main">
        <div id="viewContainer">
          ${renderLandingView()}
          ${renderCalculatorView()}
        </div>
      </main>

      <footer class="footer">
        <div class="container">
          <p>© 2026 Westside Union Crop. All Rights Reserved. - Artpresso</p>
        </div>
      </footer>
    </div>
  `;

  updateViewVisibility();
}

function renderLandingView(): string {
  return `
    <div id="landingView" class="landing-view ${currentView === 'landing' ? '' : 'hidden'}">
      <div class="bg-grid"></div>
      <div class="bg-aura"></div>
      
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title animate-slide-up" data-delay="1">PROFESSIONAL ART PRICING, SIMPLIFIED.</h1>
            <p class="hero-subtitle animate-slide-up" data-delay="2">
              Created by artists, for artists — drawing from real-world experiences, industry standards, and your own unique creative journey.
            </p>
            <div class="hero-actions animate-slide-up" data-delay="3">
              <button class="btn btn-primary btn-lg" id="letsBrewBtn">
                <span>Let's brew</span>
                <span class="btn-icon">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="about-section" id="about">
        <div class="container">
          <div class="about-grid">
            <div class="about-image">
              <img src="/about-profile.jpg" alt="Jacky Ho - Creator of Artpresso">
            </div>
            <div class="about-content">
              <h2 class="section-title">For artists, by artists</h2>
              <h3 class="about-header">Artpresso - Art + Espresso, and it sounds like "Appraisal". Yes, that's how this Asian dude came up with the name.</h3>
              <p>Jacky Ho created Artpresso in his living room, amidst the clinking of coffee mugs and the scent of oil paint. As artists, he realized that the most challenging part of our journey wasn't always the creation itself, but valuing it.</p>
              <p>Good thing he has an engineering background, he built this tool to bridge the gap between creative passion and professional reality. Combining industry data, educational background, and market traction, Artpresso brews a price that you can stand behind with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section" id="faq">
        <div class="container">
          <div class="section-header">
            <span class="section-label">Common Questions</span>
            <h2>FAQ</h2>
          </div>
          <div class="faq-grid">
            <div class="faq-item">
              <p class="faq-question">Is Artpresso free to use?</p>
              <p class="faq-answer">Yes, for now the functions are free for all. We will have more advanced features with a paid plan, coming in 2026 Q2, stay tuned.</p>
            </div>
            <div class="faq-item">
              <p class="faq-question">Can I use the app for pricing prints or just original art?</p>
              <p class="faq-answer">Yes, we have covered you :)</p>
            </div>
            <div class="faq-item">
              <p class="faq-question">Can I export my price quote?</p>
              <p class="faq-answer">Yes—export options are available in PDF format with letter size for you to print or attach to your email.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact-section" id="contact">
        <div class="container">
          <div class="card contact-card">
            <div class="section-header">
              <span class="section-label">Reach Out</span>
              <h2>Contact Us</h2>
            </div>
            <p>Still have questions? We'd love to hear from you.</p>
            <div class="contact-info">
              <a href="mailto:hello@artpresso.com" class="contact-link">
                <span class="contact-icon">✉️</span>
                <span>hello@artpresso.com</span>
              </a>
              <div class="contact-link">
                <span class="contact-icon">📍</span>
                <span>Digital Studio</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderCalculatorView(): string {
  return `
    <div id="calculatorView" class="container ${currentView === 'calculator' ? '' : 'hidden'}">
      <div class="bg-grid"></div>
      <div class="bg-aura"></div>
      <div class="layout">
        <!-- Left Column: Form -->
        <div class="form-column">
          <div class="card">
            <div class="flex-between mb-6">
              <h2 class="card-title mb-0">Artwork Details</h2>
              <button class="btn btn-secondary btn-sm" id="backToLanding">← Back</button>
            </div>
            
            <form id="artworkForm">
              <!-- Basic Info -->
              <div class="form-section">
                <h3 class="section-title">Basic Information</h3>
                
                <div class="form-group">
                  <label for="title">Artwork Title</label>
                  <input type="text" id="title" placeholder="Enter artwork title" required>
                </div>
                
                <div class="form-group">
                  <label for="artistName">Artist Name</label>
                  <input type="text" id="artistName" placeholder="Enter artist name" required>
                </div>
              </div>

              <!-- Dimensions -->
              <div class="form-section">
                <h3 class="section-title">Dimensions</h3>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="width">Width</label>
                    <input type="number" id="width" min="0.1" step="0.1" placeholder="Width" required>
                  </div>
                  <div class="form-group">
                    <label for="height">Height</label>
                    <input type="number" id="height" min="0.1" step="0.1" placeholder="Height" required>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="depth">Depth (optional, for 3D)</label>
                    <input type="number" id="depth" min="0" step="0.1" placeholder="Depth">
                  </div>
                  <div class="form-group">
                    <label for="unit">Unit</label>
                    <select id="unit">
                      <option value="inches">Inches</option>
                      <option value="cm">Centimeters</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Artist Profile -->
              <div class="form-section">
                <h3 class="section-title">Artist Profile</h3>
                
                <div class="form-group">
                  <label for="careerStage">Career Stage</label>
                  <select id="careerStage" required>
                    ${Object.entries(CAREER_STAGE_LABELS).map(([value, label]) =>
    `<option value="${value}">${label}</option>`
  ).join('')}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="education">Education / Experience</label>
                  <select id="education" required>
                    ${Object.entries(EDUCATION_LABELS).map(([value, label]) =>
    `<option value="${value}">${label}</option>`
  ).join('')}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="salesRange">Annual Sales</label>
                  <select id="salesRange" required>
                    ${Object.entries(SALES_RANGE_LABELS).map(([value, label]) =>
    `<option value="${value}">${label}</option>`
  ).join('')}
                  </select>
                </div>
              </div>

              <!-- Artwork Details -->
              <div class="form-section">
                <h3 class="section-title">Artwork Specifics</h3>
                
                <div class="form-group">
                  <label for="medium">Medium</label>
                  <select id="medium" required>
                    ${Object.entries(MEDIUM_LABELS).map(([value, label]) =>
    `<option value="${value}">${label}</option>`
  ).join('')}
                  </select>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="materialCost">Material Cost ($)</label>
                    <input type="number" id="materialCost" min="0" step="1" placeholder="0" value="0">
                  </div>
                  <div class="form-group">
                    <label for="framingCost">Framing Cost ($)</label>
                    <input type="number" id="framingCost" min="0" step="1" placeholder="0" value="0">
                  </div>
                </div>
              </div>

              <!-- Image Upload -->
              <div class="form-section">
                <h3 class="section-title">Artwork Image (Optional)</h3>
                
                <div class="image-upload" id="imageUpload">
                  <input type="file" id="artworkImage" accept="image/*" class="sr-only">
                  <label for="artworkImage" class="upload-label">
                    <span class="upload-icon">🖼️</span>
                    <span class="upload-text">Click to upload image</span>
                    <span class="upload-hint">PNG, JPG up to 5MB</span>
                  </label>
                  <div class="image-preview" id="imagePreview"></div>
                </div>
              </div>

              <!-- Currency & Calculate -->
              <div class="form-section">
                <div class="currency-toggle">
                  <label class="currency-label">Currency:</label>
                  <div class="toggle-buttons">
                    <button type="button" class="toggle-btn active" data-currency="USD">USD</button>
                    <button type="button" class="toggle-btn" data-currency="CAD">CAD</button>
                  </div>
                  <span class="exchange-rate" id="exchangeRate"></span>
                </div>
                
                <button type="submit" class="btn btn-primary btn-lg btn-full" id="calculateBtn">
                  <span>Calculate Price</span>
                  <span class="btn-icon">→</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Right Column: Quote Preview -->
        <div class="quote-column">
          <div class="card quote-card" id="quoteCard">
            <div class="quote-placeholder" id="quotePlaceholder">
              <span class="placeholder-icon">📊</span>
              <p>Fill in the artwork details and click<br><strong>"Calculate Price"</strong> to see your quote</p>
            </div>
            
            <div class="quote-content hidden" id="quoteContent">
              <!-- Will be populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateViewVisibility() {
  const landing = document.getElementById('landingView');
  const calculator = document.getElementById('calculatorView');

  if (currentView === 'landing') {
    landing?.classList.remove('hidden');
    calculator?.classList.add('hidden');
    window.scrollTo(0, 0);
  } else {
    landing?.classList.add('hidden');
    calculator?.classList.remove('hidden');
    window.scrollTo(0, 0);
    setupCalculatorListeners();
  }
}

function setupEventListeners() {
  // Navigation
  document.getElementById('navLogo')?.addEventListener('click', () => {
    currentView = 'landing';
    updateViewVisibility();
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'letsBrewBtn' || target.closest('#letsBrewBtn')) {
      currentView = 'calculator';
      updateViewVisibility();
    }

    if (target.id === 'backToLanding' || target.closest('#backToLanding')) {
      currentView = 'landing';
      updateViewVisibility();
    }
  });

  if (currentView === 'calculator') {
    setupCalculatorListeners();
  }
}

function setupCalculatorListeners() {
  const form = document.getElementById('artworkForm') as HTMLFormElement;
  if (form) {
    form.removeEventListener('submit', handleCalculate);
    form.addEventListener('submit', handleCalculate);
  }

  const toggleButtons = document.querySelectorAll('.toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => handleCurrencyChange(btn as HTMLElement));
  });

  const imageInput = document.getElementById('artworkImage') as HTMLInputElement;
  imageInput?.addEventListener('change', handleImageUpload);
}

function handleCurrencyChange(btn: HTMLElement) {
  const currency = btn.dataset.currency as Currency;
  currentCurrency = currency;

  // Update toggle UI
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Recalculate if we have a result
  if (currentCalculation) {
    const formData = getFormData();
    if (formData) {
      currentCalculation = calculatePrice(formData, currentCurrency, exchangeRate);
      renderQuote(currentCalculation, formData);
    }
  }
}

function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be under 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    artworkImageDataUrl = event.target?.result as string;
    const preview = document.getElementById('imagePreview')!;
    preview.innerHTML = `
      <img src="${artworkImageDataUrl}" alt="Artwork preview">
      <button type="button" class="remove-image" id="removeImage">×</button>
    `;
    preview.classList.add('has-image');
    document.getElementById('imageUpload')!.classList.add('has-image');

    // Add remove handler
    document.getElementById('removeImage')!.addEventListener('click', () => {
      artworkImageDataUrl = null;
      preview.innerHTML = '';
      preview.classList.remove('has-image');
      document.getElementById('imageUpload')!.classList.remove('has-image');
      input.value = '';
    });
  };
  reader.readAsDataURL(file);
}

function getFormData(): ArtworkDetails | null {
  const titleInput = document.getElementById('title') as HTMLInputElement;
  const artistInput = document.getElementById('artistName') as HTMLInputElement;
  const widthInput = document.getElementById('width') as HTMLInputElement;
  const heightInput = document.getElementById('height') as HTMLInputElement;

  if (!titleInput || !artistInput || !widthInput || !heightInput) return null;

  const title = titleInput.value.trim();
  const artistName = artistInput.value.trim();
  const width = parseFloat(widthInput.value);
  const height = parseFloat(heightInput.value);
  const depth = parseFloat((document.getElementById('depth') as HTMLInputElement).value) || undefined;
  const unit = (document.getElementById('unit') as HTMLSelectElement).value as 'inches' | 'cm';
  const careerStage = (document.getElementById('careerStage') as HTMLSelectElement).value as ArtworkDetails['careerStage'];
  const education = (document.getElementById('education') as HTMLSelectElement).value as ArtworkDetails['education'];
  const salesRange = (document.getElementById('salesRange') as HTMLSelectElement).value as ArtworkDetails['salesRange'];
  const medium = (document.getElementById('medium') as HTMLSelectElement).value as ArtworkDetails['medium'];
  const materialCost = parseFloat((document.getElementById('materialCost') as HTMLInputElement).value) || 0;
  const framingCost = parseFloat((document.getElementById('framingCost') as HTMLInputElement).value) || 0;

  if (!title || !artistName || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    title,
    artistName,
    dimensions: { width, height, depth, unit },
    careerStage,
    education,
    salesRange,
    medium,
    materialCost,
    framingCost,
    imageDataUrl: artworkImageDataUrl || undefined
  };
}

function handleCalculate(e: Event) {
  e.preventDefault();

  const formData = getFormData();
  if (!formData) {
    alert('Please fill in all required fields');
    return;
  }

  currentCalculation = calculatePrice(formData, currentCurrency, exchangeRate);
  renderQuote(currentCalculation, formData);
}

function renderQuote(calc: PriceCalculation, artwork: ArtworkDetails) {
  const placeholder = document.getElementById('quotePlaceholder')!;
  const content = document.getElementById('quoteContent')!;

  placeholder.classList.add('hidden');
  content.classList.remove('hidden');

  const dimensionStr = artwork.dimensions.depth
    ? `${artwork.dimensions.width} × ${artwork.dimensions.height} × ${artwork.dimensions.depth} ${artwork.dimensions.unit}`
    : `${artwork.dimensions.width} × ${artwork.dimensions.height} ${artwork.dimensions.unit}`;

  content.innerHTML = `
    <div class="quote-header">
      <h2 class="quote-title">Price Quote</h2>
      <p class="quote-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    ${artwork.imageDataUrl ? `
      <div class="quote-image">
        <img src="${artwork.imageDataUrl}" alt="${artwork.title}">
      </div>
    ` : ''}

    <div class="quote-artwork-info">
      <h3 class="artwork-title">"${artwork.title}"</h3>
      <p class="artwork-artist">by ${artwork.artistName}</p>
      <p class="artwork-details">${MEDIUM_LABELS[artwork.medium]} • ${dimensionStr}</p>
    </div>

    <div class="divider"></div>

    <div class="price-display">
      <p class="price-label">Recommended Retail Price</p>
      <p class="price-main">${formatCurrency(calc.totalPrice, calc.currency)}</p>
      <p class="price-range">Price Range: ${formatPriceRange(calc.lowPrice, calc.highPrice, calc.currency)}</p>
    </div>

    <div class="divider"></div>

    <div class="price-breakdown">
      <h4 class="breakdown-title">Price Breakdown</h4>
      
      <div class="breakdown-row">
        <span>Base Artwork Price</span>
        <span>${formatCurrency(calc.basePrice, calc.currency)}</span>
      </div>
      
      ${calc.materialsCost > 0 ? `
        <div class="breakdown-row">
          <span>Materials (2× markup)</span>
          <span>${formatCurrency(calc.materialsCost, calc.currency)}</span>
        </div>
      ` : ''}
      
      ${calc.framingCost > 0 ? `
        <div class="breakdown-row">
          <span>Framing (2× markup)</span>
          <span>${formatCurrency(calc.framingCost, calc.currency)}</span>
        </div>
      ` : ''}
      
      <div class="breakdown-row total">
        <span>Total</span>
        <span>${formatCurrency(calc.totalPrice, calc.currency)}</span>
      </div>
    </div>

    <div class="calculation-details">
      <button type="button" class="details-toggle" id="detailsToggle">
        <span>View Calculation Details</span>
        <span class="toggle-arrow">▼</span>
      </button>
      
      <div class="details-content hidden" id="detailsContent">
        <div class="detail-item">
          <span>Area</span>
          <span>${calc.breakdown.areaSqIn.toFixed(2)} sq in</span>
        </div>
        <div class="detail-item">
          <span>Base Rate (${CAREER_STAGE_LABELS[artwork.careerStage]})</span>
          <span>$${calc.breakdown.baseRatePerSqIn}/sq in</span>
        </div>
        <div class="detail-item">
          <span>Market Multiplier</span>
          <span>×${calc.breakdown.marketMultiplier.toFixed(3)}</span>
        </div>
        <div class="detail-item sub">
          <span>↳ Sales</span>
          <span>×${calc.breakdown.salesMultiplier}</span>
        </div>
        <div class="detail-item sub">
          <span>↳ Education</span>
          <span>×${calc.breakdown.educationMultiplier}</span>
        </div>
        <div class="detail-item">
          <span>Medium Multiplier (${MEDIUM_LABELS[artwork.medium]})</span>
          <span>×${calc.breakdown.mediumMultiplier}</span>
        </div>
        ${calc.breakdown.depthMultiplier ? `
          <div class="detail-item">
            <span>3D Depth Multiplier</span>
            <span>×${calc.breakdown.depthMultiplier.toFixed(3)}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="quote-actions">
      <button type="button" class="btn btn-primary btn-lg btn-full" id="exportPdfBtn">
        <span class="btn-icon">📄</span>
        <span>Export to PDF</span>
      </button>
    </div>
  `;

  // Add event listeners
  document.getElementById('detailsToggle')?.addEventListener('click', () => {
    const detailsContent = document.getElementById('detailsContent');
    const arrow = document.querySelector('.toggle-arrow');
    if (detailsContent && arrow) {
      detailsContent.classList.toggle('hidden');
      arrow.textContent = detailsContent.classList.contains('hidden') ? '▼' : '▲';
    }
  });

  document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
    generatePDF(artwork, calc);
  });

  // Scroll to quote on mobile
  if (window.innerWidth < 1024) {
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateExchangeRateDisplay() {
  const el = document.getElementById('exchangeRate');
  if (el && exchangeRateDate) {
    el.textContent = exchangeRateDate === 'fallback'
      ? `(1 USD = ${exchangeRate.toFixed(2)} CAD, fallback rate)`
      : `(1 USD = ${exchangeRate.toFixed(2)} CAD)`;
  }
}

// Start app
init();
