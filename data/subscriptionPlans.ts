
import type { BuilderPlan } from '../types';

export const SUBSCRIPTION_PLANS: Record<string, BuilderPlan> = {
    free: {
        id: 'free',
        name: 'مجاني',
        price: 0,
        limits: {
            pages: 5,
            products: 10,
            storage: 100,
            visits: 1000
        },
        features: {
            premiumBlocks: false,
            premiumTemplates: false,
            customDomain: false,
            ssl: true,
            builderAccess: true,
            htmlCssAccess: false
        },
        allowedTemplates: 'all',
        allowedBlocks: 'all'
    },
    basic: {
        id: 'basic',
        name: 'أساسي',
        price: 200,
        limits: {
            pages: 10,
            products: 100,
            storage: 1024,
            visits: 10000
        },
        features: {
            premiumBlocks: false,
            premiumTemplates: false,
            customDomain: true,
            ssl: true,
            builderAccess: true,
            htmlCssAccess: false
        },
        allowedTemplates: 'all',
        allowedBlocks: 'all'
    },
    pro: {
        id: 'pro',
        name: 'محترف',
        price: 500,
        limits: {
            pages: 20,
            products: 1000,
            storage: 5120,
            visits: 50000
        },
        features: {
            premiumBlocks: true,
            premiumTemplates: true,
            customDomain: true,
            ssl: true,
            builderAccess: true,
            htmlCssAccess: true
        },
        allowedTemplates: 'all',
        allowedBlocks: 'all'
    },
    enterprise: {
        id: 'enterprise',
        name: 'شركات',
        price: 1000,
        limits: {
            pages: 50,
            products: 10000,
            storage: 20480,
            visits: 100000
        },
        features: {
            premiumBlocks: true,
            premiumTemplates: true,
            customDomain: true,
            ssl: true,
            builderAccess: true,
            htmlCssAccess: true
        },
        allowedTemplates: 'all',
        allowedBlocks: 'all'
    }
};
