import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WanikaniService {

  constructor() {}

  getUser(apiKey: string) {
  return fetch('https://api.wanikani.com/v2/user', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
    }).then(res => res.json());
  }
}
