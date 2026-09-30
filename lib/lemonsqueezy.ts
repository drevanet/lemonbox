const API_URL = "https://api.lemonsqueezy.com/v1";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

type LemonSqueezyResponse = {
  data?: {
    id: string;
    type: string;

    attributes?: {
      url?: string;
      email?: string;
      name?: string;
      store_id?: number;
    };
  };

  errors?: Array<{
    detail?: string;
    title?: string;
    status?: string;
  }>;
};

/**
 * Lemon Squeezy customer sync options.
 */
type SyncLemonCustomerOptions = {
  email: string;
  name?: string | null;
  existingCustomerId?: string | null;
};

/**
 * Convert a Lemon Squeezy variant ID
 * into the application's internal plan.
 */
export function planFromVariant(
  variantId: string | number | null | undefined,
): "starter" | "basic" | "pro" | null {
  if (!variantId) {
    return null;
  }

  const id = String(variantId);

  if (
    id ===
    String(
      process.env.LEMONSQUEEZY_STARTER_VARIANT_ID || "",
    )
  ) {
    return "starter";
  }

  if (
    id ===
    String(
      process.env.LEMONSQUEEZY_BASIC_VARIANT_ID || "",
    )
  ) {
    return "basic";
  }

  if (
    id ===
    String(
      process.env.LEMONSQUEEZY_PRO_VARIANT_ID || "",
    )
  ) {
    return "pro";
  }

  return null;
}

/**
 * Create a Lemon Squeezy checkout.
 */
export async function createCheckout(
  userId: string,
  email: string | null | undefined,
  variantId: string,
  lemonCustomerId?: string | null,
) {
  const apiKey = getRequiredEnv(
    "LEMONSQUEEZY_API_KEY",
  );

  const storeId = getRequiredEnv(
    "LEMONSQUEEZY_STORE_ID",
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const checkoutData: Record<string, unknown> = {
    custom: {
      user_id: userId,
    },
  };

  if (email) {
    checkoutData.email = email;
  }

  if (lemonCustomerId) {
    checkoutData.customer_id =
      Number(lemonCustomerId);
  }

  const body = {
    data: {
      type: "checkouts",

      attributes: {
        checkout_data: checkoutData,

        product_options: {
          enabled_variants: [
            Number(variantId),
          ],

          redirect_url:
            `${appUrl}/dashboard`,

          receipt_button_text:
            "Go to Dashboard",
        },

        checkout_options: {
          media: true,
          logo: true,
          desc: true,
        },
      },

      relationships: {
        store: {
          data: {
            type: "stores",
            id: String(storeId),
          },
        },

        variant: {
          data: {
            type: "variants",
            id: String(variantId),
          },
        },
      },
    },
  };

  const response = await fetch(
    `${API_URL}/checkouts`,
    {
      method: "POST",

      headers: {
        Accept:
          "application/vnd.api+json",

        "Content-Type":
          "application/vnd.api+json",

        Authorization:
          `Bearer ${apiKey}`,
      },

      body: JSON.stringify(body),
    },
  );

  const result =
    (await response.json()) as LemonSqueezyResponse;

  if (!response.ok) {
    const detail =
      result.errors
        ?.map(
          (error) =>
            error.detail ||
            error.title ||
            "Unknown Lemon Squeezy error",
        )
        .join("; ") ||
      "Unable to create Lemon Squeezy checkout.";

    throw new Error(
      `Lemon Squeezy checkout failed: ${detail}`,
    );
  }

  const url =
    result.data?.attributes?.url;

  if (!url) {
    throw new Error(
      "Lemon Squeezy did not return a checkout URL.",
    );
  }

  return url;
}

/**
 * Create or reuse a Lemon Squeezy customer.
 *
 * This matches calls such as:
 *
 * syncLemonCustomer({
 *   email: user.email,
 *   name: user.name,
 *   existingCustomerId: user.lemonCustomerId,
 * })
 */
export async function syncLemonCustomer({
  email,
  name,
  existingCustomerId,
}: SyncLemonCustomerOptions) {
  const apiKey = getRequiredEnv(
    "LEMONSQUEEZY_API_KEY",
  );

  const storeId = getRequiredEnv(
    "LEMONSQUEEZY_STORE_ID",
  );

  /*
   * If the user already has a Lemon Squeezy
   * customer ID, reuse it.
   */
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const response = await fetch(
    `${API_URL}/customers`,
    {
      method: "POST",

      headers: {
        Accept:
          "application/vnd.api+json",

        "Content-Type":
          "application/vnd.api+json",

        Authorization:
          `Bearer ${apiKey}`,
      },

      body: JSON.stringify({
        data: {
          type: "customers",

          attributes: {
            store_id: Number(storeId),

            name:
              name?.trim() ||
              email,

            email,
          },
        },
      }),
    },
  );

  const result =
    (await response.json()) as LemonSqueezyResponse;

  if (!response.ok) {
    const detail =
      result.errors
        ?.map(
          (error) =>
            error.detail ||
            error.title ||
            "Unknown Lemon Squeezy error",
        )
        .join("; ") ||
      "Unable to create Lemon Squeezy customer.";

    throw new Error(
      `Lemon Squeezy customer sync failed: ${detail}`,
    );
  }

  const customerId =
    result.data?.id;

  if (!customerId) {
    throw new Error(
      "Lemon Squeezy did not return a customer ID.",
    );
  }

  return customerId;
}