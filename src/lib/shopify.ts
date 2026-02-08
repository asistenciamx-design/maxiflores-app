export interface ShopifyResponse<T = any> {
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
    details?: string;
}

export async function shopifyFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ShopifyResponse<T>> {
    const shopifyDomain = process.env.SHOPIFY_SHOP_URL || process.env.SHOPIFY_STORE_DOMAIN || '1dmass-ij.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
        return {
            ok: false,
            status: 500,
            error: 'Missing SHOPIFY_ACCESS_TOKEN env variable',
        };
    }

    // Clean endpoint to handle leading/trailing slashes if needed, but for now just pass through
    // Ensure we don't have double slashes if endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `https://${shopifyDomain}/admin/api/2024-01/${cleanEndpoint}`;

    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                ok: false,
                status: response.status,
                error: `Shopify API error: ${response.status}`,
                details: errorText,
            };
        }

        const data = await response.json();
        return {
            ok: true,
            status: response.status,
            data: data as T,
        };

    } catch (error: any) {
        return {
            ok: false,
            status: 500,
            error: 'Internal server error',
            details: error.message,
        };
    }
}
