import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Auth} from '../auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css' // Useremo lo stesso CSS del login
})
export class Register {
  errore = '';
  private fb = inject(FormBuilder);
  registerForm = this.fb.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  private router = inject(Router);
  private authService = inject(Auth);

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          alert('Registrazione completata! Ora puoi fare il login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.errore = err.error?.message || 'Errore durante la registrazione.';
        }
      });
    }
  }
}
