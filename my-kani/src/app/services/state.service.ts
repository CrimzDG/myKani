import { Injectable } from '@angular/core';

export interface ItemStats {
  guruPlus: number;
  meaningCorrect: number;
  meaningIncorrect: number;
  readingCorrect: number;
  readingIncorrect: number;
}

export const API_KEY_STORAGE = 'mykani_api_key';

@Injectable({ providedIn: 'root' })
export class StateService {
  apiKey: string = '';
  rememberKey: boolean = true;
  user: any = null;
  sinceDate: string | null = null;
  radicals: ItemStats | null = null;
  kanji: ItemStats | null = null;
  vocab: ItemStats | null = null;
  levelProgressions: any[] = [];

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  clear() {
    this.apiKey = '';
    this.user = null;
    this.sinceDate = null;
    this.radicals = null;
    this.kanji = null;
    this.vocab = null;
    this.levelProgressions = [];
  }
}
