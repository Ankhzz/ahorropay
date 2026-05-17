export function useMiniPay() {
  const isMiniPay = typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
  return { isMiniPay };
}