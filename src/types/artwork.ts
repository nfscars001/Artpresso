// ===== Enums =====

export type Currency = 'USD' | 'CAD';

export type Unit = 'inches' | 'cm';

export type CareerStage = 'aspiring' | 'emerging' | 'established' | 'echelon';

export type Education =
    | 'self-taught'
    | 'emerging-training'
    | 'college-graduate'
    | 'apprenticeship'
    | 'interdisciplinary'
    | 'bfa'
    | 'mfa'
    | 'academic'
    | 'professional-practice';

export type SalesRange = 'under-1k' | '1k-5k' | '5k-20k' | 'over-20k';

export type Medium =
    | 'oil'
    | 'acrylic'
    | 'watercolor'
    | 'drawing'
    | 'photography'
    | 'digital'
    | 'mixed-media'
    | 'sculpture';

// ===== Interfaces =====

export interface ArtworkDimensions {
    width: number;
    height: number;
    depth?: number;
    unit: Unit;
}

export interface ArtworkDetails {
    title: string;
    artistName: string;
    dimensions: ArtworkDimensions;
    careerStage: CareerStage;
    education: Education;
    salesRange: SalesRange;
    medium: Medium;
    materialCost: number;
    framingCost: number;
    imageDataUrl?: string;
}

export interface PriceCalculation {
    basePrice: number;
    materialsCost: number;
    framingCost: number;
    totalPrice: number;
    lowPrice: number;
    highPrice: number;
    currency: Currency;
    breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
    areaSqIn: number;
    baseRatePerSqIn: number;
    marketMultiplier: number;
    salesMultiplier: number;
    educationMultiplier: number;
    mediumMultiplier: number;
    depthMultiplier?: number;
}

// ===== Display Labels =====

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
    'aspiring': 'Aspiring',
    'emerging': 'Emerging',
    'established': 'Established',
    'echelon': 'Echelon'
};

export const EDUCATION_LABELS: Record<Education, string> = {
    'self-taught': 'Self-Taught',
    'emerging-training': 'Emerging (Some Training)',
    'college-graduate': 'College / Art School Graduate',
    'apprenticeship': 'Apprenticeship / Guild Trained',
    'interdisciplinary': 'Interdisciplinary / Cross-Trained',
    'bfa': 'BFA (Bachelor of Fine Arts)',
    'mfa': 'MFA (Master of Fine Arts)',
    'academic': 'Academic / Instructor',
    'professional-practice': 'Professional Practice'
};

export const SALES_RANGE_LABELS: Record<SalesRange, string> = {
    'under-1k': 'Under $1,000/year',
    '1k-5k': '$1,000 - $5,000/year',
    '5k-20k': '$5,000 - $20,000/year',
    'over-20k': 'Over $20,000/year'
};

export const MEDIUM_LABELS: Record<Medium, string> = {
    'oil': 'Oil',
    'acrylic': 'Acrylic',
    'watercolor': 'Watercolor',
    'drawing': 'Drawing',
    'photography': 'Photography (unique)',
    'digital': 'Digital Original',
    'mixed-media': 'Mixed Media',
    'sculpture': 'Sculpture'
};
