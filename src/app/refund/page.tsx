import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      items={[
        "Free plan users are not charged.",
        "Paid plans can be cancelled from the subscription page once Razorpay billing is enabled.",
        "Refund requests are reviewed case by case for duplicate payments, failed activation or billing errors.",
        "AI credits, media generation and marketplace automation usage may be non-refundable after consumption.",
      ]}
    />
  );
}
