import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
// Moduli per i Reactive Forms (form gestiti lato codice)
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Auth} from '../auth/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  // ReactiveFormsModule serve per far funzionare [formGroup] nell'HTML
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css' // Riutilizziamo lo stesso CSS del login per coerenza visiva
})
export class Register {

  // Variabile per mostrare a schermo messaggi di errore (es. "Email già in uso")
  errore = '';

  // Inietta il FormBuilder per creare il form in modo più compatto
  private fb = inject(FormBuilder);

  // Definizione del form e delle regole (Validatori)
  registerForm = this.fb.group({
      // Il nome parte vuoto ed è semplicemente obbligatorio
      nome: ['', Validators.required],
      // L'email è obbligatoria e deve rispettare il formato standard (es. testo@dominio.it)
      email: ['', [Validators.required, Validators.email]],
      // La password è obbligatoria e deve avere una lunghezza minima di sicurezza (6 caratteri)
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Conferma password
      confermaPassword: ['', Validators.required],
      // Il ruolo dell'utente. Di dafault settato su "FALEGNAME"
      ruolo: ['FALEGNAME', Validators.required]
    },
    {validators: this.passwordUgualiValidatore});
  // Strumenti per la navigazione e le chiamate API
  private router = inject(Router);
  private authService = inject(Auth);
  // Il ChangeDetectorRef serve per rilevare le modifiche e aggiornare l'interfaccia'
  private cdr = inject(ChangeDetectorRef);

  passwordUgualiValidatore(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const conferma = control.get('confermaPassword')?.value;

    // Se entrambi i campi hanno testo, ma sono diversi, scatta l'errore "passwordMismatch"
    if (password && conferma && password !== conferma) {
      return {passwordMismatch: true};
    }
    return null;
  }

  /**
   * Metodo richiamato quando l'utente preme "Registrati"
   */
  onSubmit() {
    // 1. Controllo di sicurezza lato frontend: blocca l'invio se il form ha errori
    if (this.registerForm.valid) {

      // 2. Chiama il servizio Auth per inviare i dati al backend (Spring Boot)
      this.authService.register(this.registerForm.value).subscribe({

        // Se il backend risponde con "OK" (Status 200/201)
        next: () => {
          // Aspettiamo che l'utente legga il messaggio e clicchi OK prima di cambiare pagina
          Swal.fire('Benvenuto!', 'Registrazione completata! Ora puoi fare il login.', 'success')
            .then(() => {
              this.router.navigate(['/login']);
            });
        },

        // Se il backend risponde con un Errore (es. Status 400 o 409)
        error: (err) => {
          // Leggiamo il messaggio di errore specifico mandato dal backend (es. "Email già presente")
          // Se non c'è un messaggio specifico (err.error?.message), usiamo un testo generico.
          this.errore = err.error?.message || 'Errore durante la registrazione.';

          this.cdr.detectChanges(); // Aggiorna l'interfaccia per mostrare l'errore a schermo
        }
      });
    }
  }
}
