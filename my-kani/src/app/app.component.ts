import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WanikaniService } from './services/wanikani.service';
import { DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, DatePipe, UpperCasePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  apiKey: string = '';
  errorMessage: string = '';
  user: any = null;
  sinceDate: string | null = null;

  constructor(private wanikani: WanikaniService) {}

  connect() {
    if (!this.apiKey.trim()) {
      this.errorMessage = 'NO API KEY ENTERED.';
      return;
    }
    this.errorMessage = '';

    // Fetch user and resets at the same time using Promise.all
    Promise.all([
      this.wanikani.getUser(this.apiKey),
      this.wanikani.getResets(this.apiKey)
    ]).then(([userData, resetsData]) => {
      this.user = userData.data;

      // If the user has reset before, use the most recent reset date
      // Otherwise fall back to their original start date
      const resets = resetsData.data ?? [];
      if (resets.length > 0) {
        const latest = resets[resets.length - 1];
        this.sinceDate = latest.data.confirmed_at;
      } else {
        this.sinceDate = this.user.started_at;
      }
    });
  }
}
