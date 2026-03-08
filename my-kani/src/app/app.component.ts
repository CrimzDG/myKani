import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WanikaniService } from './services/wanikani.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  apiKey: string = '';
  errorMessage: string = '';


  constructor(private wanikani: WanikaniService) {}

  connect() {
  if (!this.apiKey.trim()) {
    this.errorMessage = 'NO API KEY ENTERED.';
    return;
  }
  this.errorMessage = '';
  this.wanikani.getUser(this.apiKey).then(data => {
    console.log(data);
  });
}
}
