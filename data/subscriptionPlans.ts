
export interface PlanDetails {
    id: 'free' | 'basic' | 'pro' | 'enterprise';
    name: string;
    price: number;
    limits: {
        products: number;
        storage: number; // MB
        visits: number; // Monthly
    };
    features: {
        premiumBlocks: boolean;
        premiumTemplates: boolean;
        customDomain: boolean;
    };
}

export const SUBSCRIPTION_PLANS: Record<string, PlanDetails> = {
    free: {
        id: 'free',
        name: 'مجاني',
        price: 0,
        limits: {
            products: 10,
            storage: 100,
            visits: 1000
        },
        features: {
            premiumBlocks: false,
            premiumTemplates: false,
            customDomain: false
        }
    },
    basic: {
        id: 'basic',
        name: 'أساسي',
        price: 200,
        limits: {
            products: 100,
            storage: 1024,
            visits: 10000
        },
        features: {
            premiumBlocks: false,
            premiumTemplates: false,
            customDomain: true
        }
    },
    pro: {
        id: 'pro',
        name: 'محترف',
        price: 500,
        limits: {
            products: 1000,
            storage: 5120,
            visits: 50000
        },
        features: {
            premiumBlocks: true,
            premiumTemplates: true,
            customDomain: true
        }
    },
    enterprise: {
        id: 'enterprise',
        name: 'شركات',
        price: 1000,
        limits: {
            products: 10000,
            storage: 20480,
            visits: 100000
        },
        features: {
            premiumBlocks: true,
            premiumTemplates: true,
            customDomain: true
        }
    }
};
