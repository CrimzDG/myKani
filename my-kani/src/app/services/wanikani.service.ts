import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WanikaniService {

  constructor() {}

  private headers(apiKey: string) {
    return { 'Authorization': `Bearer ${apiKey}` };
  }

  getUser(apiKey: string) {
    return fetch('https://api.wanikani.com/v2/user', {
      headers: this.headers(apiKey)
    }).then(res => res.json());
  }

  getResets(apiKey: string) {
    return fetch('https://api.wanikani.com/v2/resets', {
      headers: this.headers(apiKey)
    }).then(res => res.json());
  }

}
