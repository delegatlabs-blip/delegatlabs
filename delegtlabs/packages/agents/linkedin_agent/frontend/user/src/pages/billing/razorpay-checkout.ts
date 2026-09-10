const SCRIPT_ID = "razorpay-checkout-js";
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailResponse) => void) => void;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailResponse = {
  error?: { description?: string; reason?: string };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  orderId: string;
  prefill?: { email?: string | null; name?: string | null };
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss: () => void;
  onFailed: (message: string) => void;
}): Promise<void> {
  await loadScript();
  const Ctor = window.Razorpay;
  if (!Ctor) throw new Error("Razorpay Checkout is unavailable");

  const rzp = new Ctor({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    prefill: {
      name: options.prefill?.name || "",
      email: options.prefill?.email || "",
    },
    theme: { color: "#2563eb" },
    modal: {
      ondismiss: options.onDismiss,
    },
    handler: (response: RazorpaySuccessResponse) => {
      void options.onSuccess(response);
    },
  });
  rzp.on("payment.failed", (response) => {
    options.onFailed(response.error?.description || response.error?.reason || "Payment failed");
  });
  rzp.open();
}
