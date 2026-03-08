import { Injectable } from '@angular/core';

interface WKPage {
  data: any[];
  pages?: {
    next_url: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class WanikaniService {

  constructor() {}

  private headers(apiKey: string): Record<string, string> {
    return { 'Authorization': `Bearer ${apiKey}` };
  }

  private async fetchAllPages(url: string, apiKey: string): Promise<any[]> {
    let results: any[] = [];
    let nextUrl: string | null = url;
    while (nextUrl) {
      const res: Response = await fetch(nextUrl, { headers: this.headers(apiKey) });
      const json: WKPage = await res.json();
      results = results.concat(json.data);
      nextUrl = json.pages?.next_url ?? null;
    }
    return results;
  }

  getUser(apiKey: string): Promise<any> {
    return fetch('https://api.wanikani.com/v2/user', {
      headers: this.headers(apiKey)
    }).then((res: Response) => res.json());
  }

  getResets(apiKey: string): Promise<any> {
    return fetch('https://api.wanikani.com/v2/resets', {
      headers: this.headers(apiKey)
    }).then((res: Response) => res.json());
  }

  getAssignments(apiKey: string): Promise<any[]> {
    return this.fetchAllPages('https://api.wanikani.com/v2/assignments', apiKey);
  }

  getReviewStatistics(apiKey: string): Promise<any[]> {
    return this.fetchAllPages('https://api.wanikani.com/v2/review_statistics', apiKey);
  }

}
