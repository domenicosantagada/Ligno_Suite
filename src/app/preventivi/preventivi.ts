import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {PreventiviService} from './preventivi.service';
// Importiamo i servizi della rubrica
import {RubricaService} from '../rubrica/rubrica.service';
import {Cliente} from '../rubrica/rubrica';

// @ts-ignore
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-preventivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preventivi.html',
  styleUrl: './preventivi.css',
})
export class Preventivi implements OnInit {
  preventiviService = inject(PreventiviService);
  route = inject(ActivatedRoute);
  rubricaService = inject(RubricaService); // Inietta la rubrica

  invoice = this.preventiviService.invoice;
  isPreview = signal(false);

  // Variabili per l'autocompletamento
  clienti = signal<Cliente[]>([]);
  mostraDropdownClienti = signal(false);

  // Signal calcolato: filtra i clienti in base a quello che c'è scritto nel nome
  clientiFiltrati = computed(() => {
    const term = (this.invoice().toName || '').toLowerCase().trim();
    if (!term) return this.clienti(); // Se è vuoto, mostrali tutti
    return this.clienti().filter(c => c.nome.toLowerCase().includes(term));
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['preview'] === 'true') {
        this.isPreview.set(true);
      } else {
        this.isPreview.set(false);
      }
    });

    // Carica la rubrica in background
    this.rubricaService.getClientiDalDb().subscribe({
      next: (dati) => this.clienti.set(dati),
      error: (err) => console.error('Errore caricamento clienti:', err)
    });
  }

  // Chiamato ogni volta che digiti qualcosa nel campo Nome
  onNomeClienteChange(valore: string) {
    this.preventiviService.updateInvoice({toName: valore});
    this.mostraDropdownClienti.set(true); // Assicurati che la tendina sia aperta
  }

  // Chiamato quando clicchi un cliente dalla tendina
  selezionaClienteDaDropdown(cliente: Cliente) {
    this.preventiviService.updateInvoice({
      toName: cliente.nome,
      toEmail: cliente.email || '',
      toPiva: cliente.partitaIva || ''
    });
    this.mostraDropdownClienti.set(false); // Chiudi la tendina
  }

  // Chiamato quando togli il mouse/focus dal campo di testo
  nascondiDropdownRitardato() {
    // Il timeout serve per dare il tempo al 'click' di scattare prima che la tendina sparisca
    setTimeout(() => {
      this.mostraDropdownClienti.set(false);
    }, 200);
  }

  togglePreview() {
    this.isPreview.update(v => !v);
  }

  // Metodo richiamato in automatico dal Guard quando cerchi di cambiare pagina
  puoAbbandonarePagina(): boolean {
    const inv = this.invoice();

    // Controlliamo se c'è almeno un dato inserito (per non disturbare l'utente se la pagina è già vuota)
    const haDati = inv.invoiceNumber !== '' ||
      inv.toName !== '' ||
      inv.fromName !== '' ||
      (inv.items.length > 0 && inv.items[0].description !== '');

    // Se il documento è completamente vuoto, lo lasciamo uscire subito svuotando per sicurezza
    if (!haDati) {
      this.preventiviService.resetInvoice();
      return true;
    }

    // Se c'è qualcosa di scritto, mostriamo il messaggio di avviso
    const conferma = confirm('Sei sicuro di voler lasciare la pagina? I dati non salvati andranno persi.');

    if (conferma) {
      // Se sceglie "Sì", puliamo tutto. Così al prossimo accesso il documento è di nuovo vuoto!
      this.preventiviService.resetInvoice();
      return true; // Permette la navigazione
    } else {
      // Se sceglie "No", blocchiamo il cambio pagina e lo lasciamo lì dov'è
      return false;
    }
  }

  downloadPDF() {
    const element = document.getElementById('invoice-preview-container');

    if (element) {
      const fileName = this.invoice().invoiceNumber ? `Preventivo_${this.invoice().invoiceNumber}.pdf` : 'Preventivo_Bozza.pdf';

      const opt: any = {
        margin: [10, 10, 15, 10],
        filename: fileName,
        image: {type: 'jpeg', quality: 0.98},
        html2canvas: {scale: 2, useCORS: true},
        jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'},
        pagebreak: {mode: ['css', 'legacy']}
      };

      html2pdf().set(opt).from(element).save();
    } else {
      console.error("Elemento per l'anteprima del PDF non trovato!");
    }
  }
}
