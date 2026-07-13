// testApi.js
//
// Generic tester for the endpointsMapping you shared. Since every endpoint
// uses withCredentials (cookie-based auth), you need to copy your session
// cookie from the browser once and pass it in - there's no way to log in
// from a plain script for a browser-cookie-based session.
//
// SETUP:
//   1. Open the app in your browser, log in normally.
//   2. DevTools -> Application -> Cookies -> copy the full cookie string
//      (or Network tab -> any XHR request -> Request Headers -> Cookie).
//   3. Fill in the ORIGINS below with your actual hostnames (whatever
//      getZomatoHost() / getApiHost() / getAdminZomansHost() resolve to
//      in your env - check your utils/utils.ts or just log them once).
//   4. export COOKIE='the full cookie string'
//
// USAGE:
//   node testApi.js list                        # list all endpoint names
//   node testApi.js getBrandList                 # call a GET endpoint
//   node testApi.js getAnnouncement --params '{"id":"123"}'
//   node testApi.js createDraft --body '{"foo":"bar"}'
//   node testApi.js getBrandList --variant adminZomans
//
// Flags:
//   --variant <zomato|adminZomans>   which mapping to use (default: zomato)
//   --params  '<json>'               values to substitute into :placeholders in the path
//   --query   '<json>'               query string params
//   --body    '<json>'               request body (for POST/PUT)
//   --headers '<json>'               extra headers to merge in

const ORIGINS = {
    ZOMATO_URL: process.env.ZOMATO_URL || 'https://www.zomato.com',
    MERCHANT_GW_URL: process.env.MERCHANT_GW_URL || 'https://www.zomato.com/merchant-gw',
    ADMIN_ZOMANS: process.env.ADMIN_ZOMANS || 'https://admin.zomans.com',
    ADMIN_ZOMANS_MERCHANT_GW_URL: process.env.ADMIN_ZOMANS_MERCHANT_GW_URL || 'https://admin.zomans.com/gw/internal',
    API_URL: process.env.API_URL || 'https://api.zomato.com/gw',
    LOCALHOST: 'http://localhost:3000',
};

const COMMON_HEADERS = {
    'x-client-id': 'zomato_merchant_webview',
};

// --- Trimmed endpoint maps (copied from your file, paths + methods only) ---

const endpointsMappingZomato = {
    getJumboInitConfig: { origin: 'ZOMATO_URL', endPoint: '/webroutes/webviews/zomatopay/getJumboInitConfig', method: 'GET' },
    getApprovalBanner: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/approvals/approval-banner', method: 'GET' },
    getTabbedSections: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/sections', method: 'GET' },
    getBrandList: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/entities', method: 'GET' },
    getGlobalFilterList: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/filters', method: 'GET' },
    downloadReport: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/download-ads-performance-report', method: 'POST' },
    downloadReportStatus: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/download-ads-performance-report-status', method: 'GET' },
    getAggregatedData: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/aggregated-ads-performance-metrics', method: 'POST' },
    getPerformanceTrendChart: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/ads-performance-trend-chart', method: 'POST' },
    getPerformancePieChart: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/ads-performance-pie-chart', method: 'POST' },
    getMealtimeBarChart: { origin: 'MERCHANT_GW_URL', endPoint: 'web/ads/platform/ads-performance-mealtime-bar-chart', method: 'POST' },
    getStepConfig: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/step', method: 'GET' },
    getProducts: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/products', method: 'GET' },
    createDraft: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/draft', method: 'POST' },
    createCampaign: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/create-ad', method: 'POST' },
    getPresignedUrl: { origin: 'MERCHANT_GW_URL', endPoint: '/web/platform/get-presigned-url-for-doc-upload?file_ext=.csv&source=ads-platform', method: 'GET' },
    validateCustomBudgetCsv: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/validate-custom-budget-csv', method: 'POST' },
    getEstimates: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/estimates', method: 'POST' },
    getIndividualAdGroup: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/single-ad-group', method: 'GET' },
    multipleAdGroup: { origin: 'MERCHANT_GW_URL', endPoint: '/web/ads/platform/multiple-ad-groups', method: 'POST' },
    checkAuth: { origin: 'ZOMATO_URL', endPoint: '/restaurant-onboard-diy/check-auth', method: 'GET' },
    searchEntity: { origin: 'ADMIN_ZOMANS', endPoint: 'gw/internal/ads/platform/entity', method: 'GET' },
    listAnnouncements: { origin: 'API_URL', endPoint: '/ads/announcements', method: 'GET' },
    getAnnouncement: { origin: 'API_URL', endPoint: '/ads/announcements/:id', method: 'GET' },
    markAnnouncementRead: { origin: 'API_URL', endPoint: '/ads/announcements/:id/read', method: 'POST' },
    updateAnnouncementReactions: { origin: 'API_URL', endPoint: '/ads/announcements/:id/reactions', method: 'POST' },
};

const endpointsMappingAdminZomans = {
    getJumboInitConfig: { origin: 'ADMIN_ZOMANS', endPoint: '/routes/views/zomatopay/getJumboInitConfig', method: 'GET' },
    getTabbedSections: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/sections', method: 'GET' },
    getBrandList: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/entities', method: 'GET' },
    getGlobalFilterList: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/filters', method: 'GET' },
    downloadReport: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/download-ads-performance-report', method: 'POST' },
    downloadReportStatus: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/download-ads-performance-report-status', method: 'GET' },
    getAggregatedData: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/aggregated-ads-performance-metrics', method: 'POST' },
    getPerformanceTrendChart: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/ads-performance-trend-chart', method: 'POST' },
    getPerformancePieChart: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/ads-performance-pie-chart', method: 'POST' },
    getMealtimeBarChart: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/ads-performance-mealtime-bar-chart', method: 'POST' },
    getStepConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/step', method: 'GET' },
    getProducts: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/products', method: 'GET' },
    createDraft: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/draft', method: 'POST' },
    createCampaign: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/create-ad', method: 'POST' },
    getPresignedUrl: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/generate-presigned-url', method: 'POST' },
    validateCustomBudgetCsv: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/validate-custom-budget-csv', method: 'POST' },
    getEstimates: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/estimates', method: 'POST' },
    validateScheduling: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/validate-scheduling', method: 'POST' },
    getIndividualAdGroup: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/single-ad-group', method: 'GET' },
    multipleAdGroup: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/platform/multiple-ad-groups', method: 'POST' },
    checkAuth: { origin: 'ADMIN_ZOMANS', endPoint: '/gw/internal/auth/validate', method: 'POST' },
    searchEntity: { origin: 'ADMIN_ZOMANS', endPoint: 'gw/internal/ads/platform/entity', method: 'GET' },
    trackAdsCampaigns: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/campaigns-fetch', method: 'POST' },
    trackAdsCampaignsSummary: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/campaigns-summary', method: 'POST' },
    trackAdsContracts: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/contracts-fetch', method: 'POST' },
    trackAdsContractsSummary: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/contracts-summary', method: 'POST' },
    campaignsBulkAction: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/campaigns-action', method: 'POST' },
    trackAdsBulkDownload: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/download', method: 'POST' },
    userPermissions: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/user-permissions', method: 'GET' },
    bulkOperations: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/get-operations', method: 'POST' },
    bulkToolAddOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/add-operation', method: 'POST' },
    bulkToolValidateOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/v2/validate-operation', method: 'POST' },
    bulkToolStartOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/v2/start-operation', method: 'GET' },
    bulkToolUpdateOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/update-operations', method: 'POST' },
    bulkToolUserPermissions: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bulktool/v2/get-operation-types', method: 'GET' },
    growMaxxFilters: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/get-calculator', method: 'GET' },
    growMaxxData: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/perform-calculation', method: 'POST' },
    getTrackingFilters: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/filters', method: 'GET' },
    fetchUseCases: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/usecases', method: 'GET' },
    fetchUseCaseConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/usecase', method: 'GET' },
    getConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/query', method: 'POST' },
    upsertConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/upsert', method: 'POST' },
    startBulkOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/bulk_operations/start_operation', method: 'POST' },
    getBulkOperations: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/config-manager/v1/bulk_operations', method: 'GET' },
    initiateBulkOperation: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/bulktool/v2/initiate-validate-operation', method: 'POST' },
    fetchOperationStatusDetails: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/bulktool/v2/operation-status-details', method: 'POST' },
    getPrepaidOfflineWallets: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/prepaid-offline-wallets', method: 'GET' },
    getPrepaidOfflineWalletMerchantDetails: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/prepaid-offline-wallet/merchant-details', method: 'POST' },
    getPrepaidOfflineWalletCampaignDetails: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/prepaid-offline-wallet/campaign-details', method: 'POST' },
    saveCampaignsPaymentDetails: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/save/campaigns-payment-details', method: 'POST' },
    getMerchantList: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/merchant/fetch', method: 'GET' },
    getMerchantOfficeList: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/merchant/officefetch', method: 'GET' },
    validatePhoneNumber: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/approver/validate', method: 'GET' },
    getCampaignBudgetEstimates: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/crystal-campaign/estimate', method: 'GET' },
    createBrandAdsCampaign: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/single-crystal-campaign/create', method: 'POST' },
    videoUploadStart: { origin: 'ADMIN_ZOMANS', endPoint: 'alicloud-upload/upload_start', method: 'POST' },
    videoUploadComplete: { origin: 'ADMIN_ZOMANS', endPoint: 'alicloud-upload/upload_complete', method: 'POST' },
    fetchZomatoOffice: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/zomato-office/fetch', method: 'GET' },
    getWhitelistedBrands: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/crystal-ads-data/fetch', method: 'POST' },
    bulkUploadUrls: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/creatives/bulk-upload-urls', method: 'POST' },
    fetchDishes: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/fetch/entity/l0-dishes', method: 'POST' },
    listAnnouncements: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements', method: 'GET' },
    getAnnouncement: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements/:id', method: 'GET' },
    markAnnouncementRead: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements/:id/read', method: 'POST' },
    updateAnnouncementReactions: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements/:id/reactions', method: 'POST' },
    createAnnouncement: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements/admin/create', method: 'POST' },
    updateAnnouncement: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/announcements/admin/:id', method: 'PUT' },
    previewAssets: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/crystal-campaign-preview-details', method: 'GET' },
    updateBrandAdsCampaignStatus: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/campaigns/tracking/update', method: 'POST' },
    fetchBrandAdsCampaign: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/fetch-crystal-campaigns', method: 'POST' },
    updateBrandAdsCampaign: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: 'ads/crystal-campaign/update', method: 'POST' },
    getBosEstimate: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bos-estimate', method: 'POST' },
    getBosPayment: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bos-payment', method: 'POST' },
    getBosBudget: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bos-budget', method: 'POST' },
    enhanceBosTagline: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/ai/qc/enhance', method: 'POST' },
    scoreTagline: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/ai/qc/score', method: 'POST' },
    createBosBid: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/create-bid', method: 'POST' },
    addBid: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/add-bid', method: 'POST' },
    getBosCreative: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bos-creative', method: 'POST' },
    getBosScheduling: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bos-scheduling', method: 'POST' },
    getBrandAdsFilters: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/tracking/additional-crystal-filters/fetch', method: 'GET' },
    paperContractsList: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/approvals/list', method: 'POST' },
    paperContractsDetails: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/approvals/details', method: 'POST' },
    paperContractsUpdate: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/approvals/update', method: 'POST' },
    getHpBannerConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/get-hp-banner-config-v2', method: 'GET' },
    getHpBannerSegmentationData: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/get-hp-banner-config-v2', method: 'GET' },
    validateResCsv: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/restaurant/validate-res-csv-v2', method: 'POST' },
    getPaymentData: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/get-payment-data', method: 'POST' },
    createHpBanner: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/create-hp-banner-v2', method: 'POST' },
    getHpBannerSummary: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/get-hp-banner-summary', method: 'GET' },
    fetchHpBanners: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/multiple-hp-banners', method: 'GET' },
    editHpBanner: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/hp-banner/edit-hp-banner', method: 'POST' },
    bosBiddingMultipleBids: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/multiple-bids', method: 'GET' },
    bosBiddingConfig: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/bidding-config', method: 'GET' },
    bosTopBids: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/top-bids', method: 'GET' },
    bosUpdateBid: { origin: 'ADMIN_ZOMANS_MERCHANT_GW_URL', endPoint: '/ads/bidding/update-bid', method: 'POST' },
};

// --- CLI plumbing ---

function parseArgs(argv) {
    const [command, ...rest] = argv;
    const flags = { variant: 'zomato', params: {}, query: {}, body: undefined, headers: {} };
    for (let i = 0; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        const value = rest[i + 1];
        if (key === 'variant') flags.variant = value;
        else if (key === 'params') flags.params = JSON.parse(value);
        else if (key === 'query') flags.query = JSON.parse(value);
        else if (key === 'body') flags.body = JSON.parse(value);
        else if (key === 'headers') flags.headers = JSON.parse(value);
    }
    return { command, flags };
}

function buildUrl(entry, params, query) {
    const originBase = ORIGINS[entry.origin] || '';
    let path = entry.endPoint;

    // substitute :placeholders, e.g. /ads/announcements/:id
    for (const [key, value] of Object.entries(params || {})) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
    }

    const fullUrl = new URL(path.startsWith('/') ? originBase + path : originBase + '/' + path);
    for (const [key, value] of Object.entries(query || {})) {
        fullUrl.searchParams.set(key, value);
    }
    return fullUrl.toString();
}

async function callEndpoint(name, flags) {
    const map = flags.variant === 'adminZomans' ? endpointsMappingAdminZomans : endpointsMappingZomato;
    const entry = map[name];

    if (!entry) {
        console.error(`Unknown endpoint "${name}" for variant "${flags.variant}". Run "node testApi.js list" to see options.`);
        process.exit(1);
    }

    const url = buildUrl(entry, flags.params, flags.query);
    const cookie = process.env.COOKIE;

    if (!cookie) {
        console.warn('WARNING: no COOKIE env var set - request will likely be unauthenticated (401/403 expected).');
    }

    const headers = {
        ...COMMON_HEADERS,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(flags.body ? { 'Content-Type': 'application/json' } : {}),
        ...flags.headers,
    };

    console.log(`\n${entry.method} ${url}`);
    if (flags.body) console.log('Body:', JSON.stringify(flags.body));

    const res = await fetch(url, {
        method: entry.method,
        headers,
        body: flags.body ? JSON.stringify(flags.body) : undefined,
    });

    console.log(`Status: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } else {
        const text = await res.text();
        console.log(text.slice(0, 1000));
    }
}

function listEndpoints() {
    console.log('zomato variant:');
    Object.entries(endpointsMappingZomato).forEach(([name, e]) => console.log(`  ${name.padEnd(35)} ${e.method.padEnd(6)} ${e.origin}${e.endPoint}`));
    console.log('\nadminZomans variant:');
    Object.entries(endpointsMappingAdminZomans).forEach(([name, e]) => console.log(`  ${name.padEnd(35)} ${e.method.padEnd(6)} ${e.origin}${e.endPoint}`));
}

(async () => {
    const { command, flags } = parseArgs(process.argv.slice(2));

    if (!command || command === 'list') {
        listEndpoints();
        return;
    }

    await callEndpoint(command, flags);
})();