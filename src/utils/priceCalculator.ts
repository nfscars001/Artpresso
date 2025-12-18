import type {
    CareerStage,
    Education,
    SalesRange,
    Medium,
    Currency,
    ArtworkDetails,
    PriceCalculation,
    PriceBreakdown
} from '../types/artwork';

// ===== Constants =====

const BASE_RATES: Record<CareerStage, number> = {
    'aspiring': 1.25,
    'emerging': 3.00,
    'established': 7.00,
    'echelon': 15.00
};

const PRICE_BANDS: Record<CareerStage, number> = {
    'aspiring': 0.25,
    'emerging': 0.20,
    'established': 0.15,
    'echelon': 0.10
};

const SALES_MULTIPLIERS: Record<SalesRange, number> = {
    'under-1k': 0.90,
    '1k-5k': 1.00,
    '5k-20k': 1.15,
    'over-20k': 1.30
};

const EDUCATION_MULTIPLIERS: Record<Education, number> = {
    'self-taught': 0.95,
    'emerging-training': 1.00,
    'college-graduate': 1.05,
    'apprenticeship': 1.08,
    'interdisciplinary': 1.10,
    'bfa': 1.10,
    'mfa': 1.18,
    'academic': 1.15,
    'professional-practice': 1.20
};

const MEDIUM_MULTIPLIERS: Record<Medium, number> = {
    'oil': 1.30,
    'acrylic': 1.15,
    'watercolor': 1.00,
    'drawing': 0.85,
    'photography': 0.80,
    'digital': 0.90,
    'mixed-media': 1.20,
    'sculpture': 1.50
};

// Default fallback rate
const DEFAULT_USD_CAD_RATE = 1.36;

// ===== Exchange Rate Fetching =====

interface ExchangeRateCache {
    rate: number;
    date: string;
    timestamp: number;
}

let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function fetchExchangeRate(): Promise<{ rate: number; date: string }> {
    const now = Date.now();

    // Return cached rate if still valid
    if (exchangeRateCache && now - exchangeRateCache.timestamp < CACHE_DURATION) {
        return { rate: exchangeRateCache.rate, date: exchangeRateCache.date };
    }

    try {
        // Using exchangerate-api.com free tier
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Failed to fetch exchange rate');

        const data = await response.json();
        const rate = data.rates.CAD;
        const date = new Date().toISOString().split('T')[0];

        exchangeRateCache = { rate, date, timestamp: now };
        return { rate, date };
    } catch (error) {
        console.warn('Failed to fetch exchange rate, using default:', error);
        return {
            rate: DEFAULT_USD_CAD_RATE,
            date: 'fallback'
        };
    }
}

// ===== Helper Functions =====

function convertToinches(value: number, unit: 'inches' | 'cm'): number {
    return unit === 'cm' ? value / 2.54 : value;
}

function roundToNearest(value: number, nearest: number = 5): number {
    return Math.round(value / nearest) * nearest;
}

// ===== Main Price Calculator =====

export function calculatePrice(
    artwork: ArtworkDetails,
    currency: Currency = 'USD',
    exchangeRate: number = DEFAULT_USD_CAD_RATE
): PriceCalculation {
    const { dimensions, careerStage, education, salesRange, medium, materialCost, framingCost } = artwork;

    // Step 1: Normalize dimensions to inches
    const widthIn = convertToinches(dimensions.width, dimensions.unit);
    const heightIn = convertToinches(dimensions.height, dimensions.unit);
    const depthIn = dimensions.depth ? convertToinches(dimensions.depth, dimensions.unit) : 0;

    // Step 2: Calculate area
    const areaSqIn = widthIn * heightIn;

    // Step 3: Get base rate by career stage
    const baseRatePerSqIn = BASE_RATES[careerStage];

    // Step 4: Calculate market multiplier (sales × education)
    const salesMultiplier = SALES_MULTIPLIERS[salesRange];
    const educationMultiplier = EDUCATION_MULTIPLIERS[education];
    const marketMultiplier = salesMultiplier * educationMultiplier;

    // Step 5: Get medium multiplier
    const mediumMultiplier = MEDIUM_MULTIPLIERS[medium];

    // Step 6: Calculate base artwork price
    let basePrice = areaSqIn * baseRatePerSqIn * marketMultiplier * mediumMultiplier;

    // Step 7: Apply 3D adjustment if depth exists
    let depthMultiplier: number | undefined;
    if (depthIn > 0) {
        const maxDimension = Math.max(heightIn, widthIn);
        depthMultiplier = 1 + (depthIn / maxDimension) * 0.5;
        basePrice = basePrice * depthMultiplier;
    }

    // Step 8: Calculate materials and framing line items (2× markup)
    const materialsCost = materialCost * 2;
    const framingCostLine = framingCost * 2;

    // Step 9: Calculate total price
    const totalPriceUSD = basePrice + materialsCost + framingCostLine;

    // Step 10: Calculate price range (confidence band)
    const band = PRICE_BANDS[careerStage];
    const lowPriceUSD = totalPriceUSD * (1 - band);
    const highPriceUSD = totalPriceUSD * (1 + band);

    // Step 11: Convert to display currency
    const conversionRate = currency === 'CAD' ? exchangeRate : 1;
    const totalPrice = roundToNearest(totalPriceUSD * conversionRate);
    const lowPrice = roundToNearest(lowPriceUSD * conversionRate);
    const highPrice = roundToNearest(highPriceUSD * conversionRate);

    // Build breakdown for display
    const breakdown: PriceBreakdown = {
        areaSqIn: Math.round(areaSqIn * 100) / 100,
        baseRatePerSqIn,
        marketMultiplier: Math.round(marketMultiplier * 1000) / 1000,
        salesMultiplier,
        educationMultiplier,
        mediumMultiplier,
        depthMultiplier: depthMultiplier ? Math.round(depthMultiplier * 1000) / 1000 : undefined
    };

    return {
        basePrice: roundToNearest(basePrice * conversionRate),
        materialsCost: roundToNearest(materialsCost * conversionRate),
        framingCost: roundToNearest(framingCostLine * conversionRate),
        totalPrice,
        lowPrice,
        highPrice,
        currency,
        breakdown
    };
}

// ===== Format Helpers =====

export function formatCurrency(amount: number, currency: Currency): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

export function formatPriceRange(low: number, high: number, currency: Currency): string {
    return `${formatCurrency(low, currency)} – ${formatCurrency(high, currency)}`;
}
