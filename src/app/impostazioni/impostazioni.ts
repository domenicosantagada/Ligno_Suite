import {ChangeDetectorRef, Component, inject, OnInit, signal} from '@angular/core';
// ChangeDetectorRef: serve per forzare Angular ad aggiornare la vista (il form)
// quando cambiamo dei dati in modo asincrono (es. dopo aver ricevuto un errore dal server).
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Auth} from '../auth/auth';
// SweetAlert2: Libreria esterna per mostrare popup di avviso (successo, errore, ecc.) molto più belli dei classici "alert()" nativi.
import Swal from 'sweetalert2';

/**
 * INTERFACCIA ProfiloAzienda
 */
export interface ProfiloAzienda {
  nomeAzienda: string;
  nomeTitolare: string;
  cognomeTitolare: string;
  email: string;
  telefono: string;
  partitaIva: string;
  codiceFiscale: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  // logoBase64 può essere una stringa (il file convertito in testo), un ArrayBuffer o null se non c'è.
  logoBase64: string | ArrayBuffer | null;
}

@Component({
  selector: 'app-impostazioni',
  standalone: true, // Indica che il componente non ha bisogno di un NgModule per funzionare
  imports: [CommonModule, FormsModule], // FormsModule è fondamentale per usare (ngModel) nell'HTML
  templateUrl: './impostazioni.html',
  styleUrl: './impostazioni.css'
})
export class Impostazioni implements OnInit {

  authService = inject(Auth); // Inietta il servizio che si occupa delle chiamate al backend e della sessione
  cdr = inject(ChangeDetectorRef); // Inietta il rilevatore di cambiamenti di Angular

  // Variabile per mostrare messaggi di errore specifici sotto il campo email
  erroreEmail = '';

  /**
   * SIGNAL: 'profilo'
   * Quando il valore di un Signal cambia, Angular aggiorna automaticamente ed
   * efficientemente solo le parti di HTML (template) in cui viene utilizzato.
   */
  profilo = signal<ProfiloAzienda>({
    nomeAzienda: '',
    nomeTitolare: '',
    cognomeTitolare: '',
    email: '',
    telefono: '',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    logoBase64: null
  });

  // variabile per memorizzare i dati originali (prima di qualsiasi modifica)
  // Questo serve per ripristinare i dati originali se si fa clic su "Annulla"
  datiOriginali: ProfiloAzienda | null = null;


  // metodo che viene chiamato quando il componente viene creato
  ngOnInit() {
    this.caricaDatiUtente();
  }

  /* ==========================================================================
     METODI E LOGICA APPLICATIVA
     ========================================================================== */

  /**
   * Recupera i dati dell'utente attualmente loggato (salvati nella memoria del browser)
   * e riempie i campi del form.
   */
  caricaDatiUtente() {
    const utente = this.authService.getUtenteLoggato();

    // se c'è un utente loggato, carichiamo i suoi dati nel form
    if (utente) {
      // Creiamo un oggetto "pulito". Se nel database un campo era nullo o mancante,
      // usiamo l'operatore "||" (OR) per assegnargli una stringa vuota ''.
      // Questo evita errori quando i campi di testo dell'HTML cercano di leggere "null".
      const datiCaricati: ProfiloAzienda = {
        nomeAzienda: utente.nomeAzienda || utente.nome || '',
        nomeTitolare: utente.nomeTitolare || '',
        cognomeTitolare: utente.cognomeTitolare || '',
        email: utente.email || '',
        telefono: utente.telefono || '',
        partitaIva: utente.partitaIva || '',
        codiceFiscale: utente.codiceFiscale || '',
        indirizzo: utente.indirizzo || '',
        citta: utente.citta || '',
        cap: utente.cap || '',
        provincia: utente.provincia || '',
        logoBase64: utente.logoBase64 || null
      };

      // Inseriamo i dati nel Signal per farli apparire a schermo
      this.profilo.set(datiCaricati);

      // in questo modo stiamo sicuri che i dati originali siano stati memorizzati correttamente
      // serve a creare una copia “profonda” (deep copy) di datiCaricati e salvarla in this.datiOriginali,
      // così datiOriginali rimane un’istantanea dei dati “originali” anche se in seguito modifichi datiCaricati
      this.datiOriginali = JSON.parse(JSON.stringify(datiCaricati));
    }
  }

  /**
   * Raccoglie i dati dal form e li invia al database per il salvataggio.
   */
  salvaImpostazioni() {
    const utenteLoggato = this.authService.getUtenteLoggato();
    if (!utenteLoggato) return;

    // SPREAD OPERATOR (...):
    // PASSO 1: Crea un oggetto vuoto
    // PASSO 2: Prende l'oggetto vuoto e ci mette dentro tutte le proprietà di utenteLoggato.
    // PASSO 3: Prende l'oggetto risultante e ci mette dentro tutte le proprietà di this.profilo() sovrascrivendo quelle già presenti.
    // In questo modo, se ad esempio utenteLoggato ha { nomeAzienda: "Vecchio Nome", email: "" }
    // e this.profilo() ha { nomeAzienda: "Nuovo Nome", email: "Nuova Email" }, il risultato finale sarà { nomeAzienda: "Nuovo Nome", email: "Nuova Email" }.
    const datiDaInviare = {
      ...utenteLoggato,
      ...this.profilo()
    };

    // Chiamata asincrona al backend (metodo PUT)
    this.authService.updateProfilo(utenteLoggato.id, datiDaInviare).subscribe({
      // next: Cosa fare se il server risponde "Tutto OK"
      next: (utenteAggiornatoDalDb) => {
        // 1. Aggiorniamo la "sessione" nel browser con i nuovi dati
        this.authService.setUtenteLoggato(utenteAggiornatoDalDb);

        // 2. Facciamo una nuova "fotografia" di backup con i dati appena salvati
        this.datiOriginali = JSON.parse(JSON.stringify(this.profilo()));

        // 3. Mostriamo il popup di successo verde
        Swal.fire({
          title: 'Salvato!',
          text: 'Le impostazioni sono state aggiornate con successo.',
          icon: 'success',
          confirmButtonText: 'Ok',
          customClass: {confirmButton: 'btn btn-success px-4 rounded-pill'},
          buttonsStyling: false // Disabilita gli stili di default per usare le nostre classi Bootstrap
        });
      },
      // error: Cosa fare se il server restituisce un errore
      error: (err) => {
        console.error("Errore durante il salvataggio:", err);

        // Controllo se il backend ci segnala il codice HTTP 409 (Conflict).
        // Questo avviene solitamente se si prova a usare una email già presente nel DB per un altro utente.
        if (err.status === 409) {
          this.erroreEmail = 'Questa email è già in uso da un altro utente.';
          // Forziamo Angular ad aggiornare la grafica immediatamente per mostrare la scritta rossa
          this.cdr.detectChanges();
        } else {
          // Errore generico
          Swal.fire('Errore', 'Impossibile salvare le impostazioni.', 'error');
        }
      }
    });
  }

  /**
   * Serve per aggiornare un signal in modo parziale, senza dover passare tutti i campi ogni volta.
   * Partial<ProfiloAzienda> significa che accetta un oggetto che ha SOLO ALCUNE delle
   * proprietà del ProfiloAzienda (es. { nomeAzienda: "Nuovo Nome" }).
   */
  updateProfilo(updates: Partial<ProfiloAzienda>) {
    // Prende i valori correnti (current), li copia e sovrascrive solo quelli indicati in 'updates'
    this.profilo.update(current => ({...current, ...updates}));
  }

  /* ==========================================================================
     GESTIONE DEL FILE (LOGO AZIENDA)
     ========================================================================== */

  /**
   * Questo metodo si innesca quando l'utente sceglie un file immagine dal proprio PC.
   */
  onLogoSelected(event: Event) {
    // Navighiamo nell'evento per pewnswew il file selezionato dall'input HTML
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      // Validazione di sicurezza lato client: verifichiamo che sia un'immagine
      if (!file.type.startsWith('image/')) {
        Swal.fire('Errore', 'Per favore seleziona un file immagine (JPG, PNG).', 'error');
        return;
      }

      // FileReader serve per leggere il contenuto del file fisicamente dal disco del PC
      const reader = new FileReader();

      // Diciamo al reader cosa fare "quando ha finito di caricare"
      reader.onload = () => {
        // reader.result conterrà una lunga stringa di testo detta "Base64".
        // Convertiamo l'immagine in testo per poterla salvare comodamente nel Database
        // assieme agli altri dati anagrafici (senza dover configurare server di storage complessi).
        this.updateProfilo({logoBase64: reader.result});
      };

      // Diamo il via alla lettura vera e propria convertendo il file nel formato "Data URL" (Base64)
      reader.readAsDataURL(file);
    }
  }

  /**
   * Elimina il logo impostando a null il suo campo nel Signal.
   */
  rimuoviLogo() {
    this.updateProfilo({logoBase64: null});
  }

  /**
   * Si innesca quando si clicca "Annulla".
   * Ripristina i dati prendendoli dalla "fotografia" scattata all'inizio.
   */
  annullaModifiche() {
    if (this.datiOriginali) {
      // Usiamo di nuovo JSON parse/stringify per non passare la referenza diretta
      this.profilo.set(JSON.parse(JSON.stringify(this.datiOriginali)));
    }
  }
}
