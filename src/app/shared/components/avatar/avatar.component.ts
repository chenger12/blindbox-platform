import { Component, Input, OnChanges } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ArtService } from '../../../services/art/art.service';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent implements OnChanges {
  @Input() seed: string | number = 'me';
  html: SafeHtml = '';

  constructor(private readonly art: ArtService) {}

  ngOnChanges(): void {
    this.html = this.art.avatar(this.seed === 'me' || this.seed === 'you' ? 'goldie-me' : this.seed);
  }
}
