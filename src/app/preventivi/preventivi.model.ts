// src/app/preventivi/preventivi.model.ts

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number | string;
  unitaMisura: string;
  rate: number | string;
  amount: number;
}

export interface InvoiceData {
  id?: number; // Primary key (opzionale con '?')
  invoiceNumber: number | null;
  date: string;

  fromName: string;
  fromEmail: string;
  fromPiva?: string;

  toName: string;
  toEmail: string;
  toPiva?: string;

  items: InvoiceItem[];
  taxRate: number | string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  utenteId?: number; // AGGIUNGI QUESTO (opzionale con '?')
}
