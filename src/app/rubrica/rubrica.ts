import {Component, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefono: string;
  partitaIva: string;
}

@Component({
  selector: 'app-rubrica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rubrica.html',
  styleUrl: './rubrica.css',
})
export class Rubrica {

  clienti = signal<Cliente[]>([
    {
      id: '1',
      nome: 'Mario Rossi Carpenteria',
      email: 'info@mariorossi.it',
      telefono: '02 1234567',
      partitaIva: 'IT12345678901'
    },
    {
      id: '2',
      nome: 'Studio Architettura Verdi',
      email: 'progetti@studioverdi.com',
      telefono: '333 9876543',
      partitaIva: 'IT09876543210'
    }
  ]);

  searchTerm = signal('');

  // --- NUOVE VARIABILI PER IL FORM ---
  mostraForm = signal(false); // Controlla se mostrare la tabella o il form
  clienteCorrente = signal<Cliente>({id: '', nome: '', email: '', telefono: '', partitaIva: ''});
  filteredClienti = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.clienti().filter(c =>
      c.nome.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  // AGGIUNGI QUESTO METODO:
  aggiornaCampoForm(campo: keyof Cliente, valore: string) {
    this.clienteCorrente.update(c => ({...c, [campo]: valore}));
  }

  // --- NUOVA LOGICA DEI PULSANTI ---

  creaNuovo() {
    // Svuota il form e lo mostra
    this.clienteCorrente.set({id: '', nome: '', email: '', telefono: '', partitaIva: ''});
    this.mostraForm.set(true);
  }

  modificaCliente(cliente: Cliente) {
    // Copia i dati del cliente nel form e lo mostra
    this.clienteCorrente.set({...cliente});
    this.mostraForm.set(true);
  }

  annulla() {
    // Chiude il form senza salvare
    this.mostraForm.set(false);
  }

  salvaCliente() {
    const dati = this.clienteCorrente();

    if (!dati.nome || dati.nome.trim() === '') {
      alert('Inserisci almeno la Ragione Sociale / Nome.');
      return;
    }

    if (dati.id === '') {
      // È un NUOVO cliente (generiamo un ID finto provvisorio)
      dati.id = Date.now().toString();
      this.clienti.update(list => [...list, dati]);
    } else {
      // È una MODIFICA di un cliente esistente
      this.clienti.update(list => list.map(c => c.id === dati.id ? dati : c));
    }

    // Chiudi il form al termine
    this.mostraForm.set(false);
  }

  eliminaCliente(id: string) {
    if (confirm('Sei sicuro di voler eliminare questo cliente dalla rubrica?')) {
      this.clienti.update(list => list.filter(c => c.id !== id));
    }
  }
}
