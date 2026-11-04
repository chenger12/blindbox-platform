import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-section',
  templateUrl: './search-section.component.html',
  styleUrl: './search-section.component.scss'
})
export class SearchSectionComponent {
  readonly form: FormGroup<{ q: FormControl<string> }>;

  constructor(fb: FormBuilder, private readonly router: Router) {
    this.form = fb.nonNullable.group({ q: [''] });
  }

  submit(): void {
    void this.router.navigate(['/boxes'], { queryParams: { q: this.form.controls.q.value.trim() || null } });
  }
}
