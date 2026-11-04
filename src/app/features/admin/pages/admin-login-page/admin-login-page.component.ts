import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LangCode } from '../../../../models/theme/theme.model';
import { AdminAuthService } from '../../../../services/admin-auth/admin-auth.service';
import { I18nService } from '../../../../services/i18n/i18n.service';

@Component({
  selector: 'app-admin-login-page',
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss'
})
export class AdminLoginPageComponent {
  readonly form: FormGroup<{ username: FormControl<string>; password: FormControl<string> }>;
  error = false;
  busy = false;

  constructor(fb: FormBuilder, private readonly auth: AdminAuthService, private readonly router: Router, readonly i18n: I18nService) {
    this.form = fb.nonNullable.group({ username: ['', Validators.required], password: ['', Validators.required] });
  }

  setLang(code: string): void {
    void this.i18n.use(code as LangCode);
  }

  submit(): void {
    if (this.form.invalid) { return; }
    this.busy = true;
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe(ok => {
      this.busy = false;
      this.error = !ok;
      if (ok) { void this.router.navigate(['/admin']); }
    });
  }
}
