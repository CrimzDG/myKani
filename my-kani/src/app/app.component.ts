import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WanikaniService } from './services/wanikani.service';
import { DatePipe, UpperCasePipe, DecimalPipe } from '@angular/common';

interface ItemStats {
  guruPlus: number;
  meaningCorrect: number;
  meaningIncorrect: number;
  readingCorrect: number;
  readingIncorrect: number;
}

const API_KEY_STORAGE = 'mykani_api_key';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, DatePipe, UpperCasePipe, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  apiKey: string = '';
  errorMessage: string = '';
  user: any = null;
  sinceDate: string | null = null;
  isLoading: boolean = false;
  rememberKey: boolean = true;

  radicals: ItemStats | null = null;
  kanji: ItemStats | null = null;
  vocab: ItemStats | null = null;

  openSection: string | null = null;

  private requestId: number = 0;

  constructor(private wanikani: WanikaniService) {}

  ngOnInit() {
    const saved = localStorage.getItem(API_KEY_STORAGE)
                ?? sessionStorage.getItem(API_KEY_STORAGE);
    if (saved) {
      this.apiKey = saved;
      this.rememberKey = !!localStorage.getItem(API_KEY_STORAGE);
      this.connect();
    }
  }

  clearApiKey() {
    this.requestId++;
    localStorage.removeItem(API_KEY_STORAGE);
    sessionStorage.removeItem(API_KEY_STORAGE);
    this.apiKey = '';
    this.user = null;
    this.radicals = null;
    this.kanji = null;
    this.vocab = null;
    this.sinceDate = null;
    this.isLoading = false;
    this.errorMessage = '';
  }

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? null : section;
  }

  accuracyPct(correct: number, incorrect: number): number {
    const total = correct + incorrect;
    if (total === 0) return 0;
    return (correct / total) * 100;
  }

  get totalAccuracy(): number {
    if (!this.radicals || !this.kanji || !this.vocab) return 0;
    const correct =
      this.radicals.meaningCorrect +
      this.kanji.meaningCorrect + this.kanji.readingCorrect +
      this.vocab.meaningCorrect + this.vocab.readingCorrect;
    const incorrect =
      this.radicals.meaningIncorrect +
      this.kanji.meaningIncorrect + this.kanji.readingIncorrect +
      this.vocab.meaningIncorrect + this.vocab.readingIncorrect;
    return this.accuracyPct(correct, incorrect);
  }

  get totalGuruPlus(): number {
    if (!this.radicals || !this.kanji || !this.vocab) return 0;
    return this.radicals.guruPlus + this.kanji.guruPlus + this.vocab.guruPlus;
  }

  connect() {
    if (!this.apiKey.trim()) {
      this.errorMessage = 'NO API KEY ENTERED.';
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;

    const currentRequestId = ++this.requestId;

    if (this.rememberKey) {
      localStorage.setItem(API_KEY_STORAGE, this.apiKey);
      sessionStorage.removeItem(API_KEY_STORAGE);
    } else {
      sessionStorage.setItem(API_KEY_STORAGE, this.apiKey);
      localStorage.removeItem(API_KEY_STORAGE);
    }

    Promise.all([
      this.wanikani.getUser(this.apiKey),
      this.wanikani.getResets(this.apiKey),
      this.wanikani.getAssignments(this.apiKey),
      this.wanikani.getReviewStatistics(this.apiKey)
    ]).then(([userData, resetsData, assignments, reviewStats]) => {
      if (currentRequestId !== this.requestId) return;

      this.user = userData.data;
      this.isLoading = false;

      const resets = resetsData.data ?? [];
      this.sinceDate = resets.length > 0
        ? resets[resets.length - 1].data.confirmed_at
        : this.user.started_at;

      const assignmentMap = new Map<number, any>();
      for (const a of assignments) {
        assignmentMap.set(a.data.subject_id, a.data);
      }

      const computed: Record<string, ItemStats> = {
        radical:    { guruPlus: 0, meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
        kanji:      { guruPlus: 0, meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
        vocabulary: { guruPlus: 0, meaningCorrect: 0, meaningIncorrect: 0, readingCorrect: 0, readingIncorrect: 0 },
      };

      for (const a of assignments) {
        const type = a.data.subject_type;
        if (computed[type] && a.data.srs_stage >= 5) computed[type].guruPlus++;
      }

      for (const stat of reviewStats) {
        const assignment = assignmentMap.get(stat.data.subject_id);
        if (!assignment) continue;
        const type = assignment.subject_type;
        if (!computed[type]) continue;
        computed[type].meaningCorrect   += stat.data.meaning_correct   ?? 0;
        computed[type].meaningIncorrect += stat.data.meaning_incorrect ?? 0;
        computed[type].readingCorrect   += stat.data.reading_correct   ?? 0;
        computed[type].readingIncorrect += stat.data.reading_incorrect ?? 0;
      }

      this.radicals = computed['radical'];
      this.kanji    = computed['kanji'];
      this.vocab    = computed['vocabulary'];

    }).catch(() => {
      if (currentRequestId !== this.requestId) return;
      this.isLoading = false;
      this.errorMessage = 'FAILED TO FETCH DATA. CHECK YOUR API KEY.';
      this.user = null;
    });
  }
}
