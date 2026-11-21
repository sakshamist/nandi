import { CustomerType } from "@/contracts";

export function inferCustomerType(messageText: string): CustomerType {
  const normalized = messageText.toLowerCase();
  if (/(cooperative|co-operative|society|group of farmers|group)/.test(normalized)) {
    return CustomerType.Cooperative;
  }
  if (/(dairy|milk|cow|cattle|buffalo)/.test(normalized)) {
    return CustomerType.DairyFarm;
  }
  if (/(individual|owner|myself|my animal|my cow)/.test(normalized)) {
    return CustomerType.Individual;
  }
  return CustomerType.Other;
}
