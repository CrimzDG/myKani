import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { WanikaniService } from '../../services/wanikani.service';
import { StateService, ItemStats, API_KEY_STORAGE } from '../../services/state.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, DecimalPipe, DatePipe, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  errorMessage: string = '';
  isLoading: boolean = false;
  openSection: string | null = null;
  private requestId: number = 0;

  constructor(
    public state: StateService,
    private wanikani: WanikaniService,
    private router: Router
  ) {}

  ngOnInit() {
    // If already loaded, don't refetch
    if (this.state.isLoggedIn) return;

    const saved = localStorage.getItem(API_KEY_STORAGE)
                ?? sessionStorage.getItem(API_KEY_STORAGE);
    if (saved) {
      this.state.apiKey = saved;
      this.state.rememberKey = !!localStorage.getItem(API_KEY_STORAGE);
      this.connect();
    }
  }

  clearApiKey() {
    this.requestId++;
    localStorage.removeItem(API_KEY_STORAGE);
    sessionStorage.removeItem(API_KEY_STORAGE);
    this.state.clear();
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
    const { radicals, kanji, vocab } = this.state;
    if (!radicals || !kanji || !vocab) return 0;
    const correct = radicals.meaningCorrect +
      kanji.meaningCorrect + kanji.readingCorrect +
      vocab.meaningCorrect + vocab.readingCorrect;
    const incorrect = radicals.meaningIncorrect +
      kanji.meaningIncorrect + kanji.readingIncorrect +
      vocab.meaningIncorrect + vocab.readingIncorrect;
    return this.accuracyPct(correct, incorrect);
  }

  get totalGuruPlus(): number {
    const { radicals, kanji, vocab } = this.state;
    if (!radicals || !kanji || !vocab) return 0;
    return radicals.guruPlus + kanji.guruPlus + vocab.guruPlus;
  }

  connect() {
    if (!this.state.apiKey.trim()) {
      this.errorMessage = 'NO API KEY ENTERED.';
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;

    const currentRequestId = ++this.requestId;

    if (this.state.rememberKey) {
      localStorage.setItem(API_KEY_STORAGE, this.state.apiKey);
      sessionStorage.removeItem(API_KEY_STORAGE);
    } else {
      sessionStorage.setItem(API_KEY_STORAGE, this.state.apiKey);
      localStorage.removeItem(API_KEY_STORAGE);
    }

    Promise.all([
      this.wanikani.getUser(this.state.apiKey),
      this.wanikani.getResets(this.state.apiKey),
      this.wanikani.getAssignments(this.state.apiKey),
      this.wanikani.getReviewStatistics(this.state.apiKey),
      this.wanikani.getLevelProgressions(this.state.apiKey)
    ]).then(([userData, resetsData, assignments, reviewStats, levelProgressions]) => {
      if (currentRequestId !== this.requestId) return;

      this.state.user = userData.data;
      this.state.levelProgressions = levelProgressions;
      this.isLoading = false;

      const resets = resetsData.data ?? [];
      this.state.sinceDate = resets.length > 0
        ? resets[resets.length - 1].data.confirmed_at
        : this.state.user.started_at;

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

      this.state.radicals = computed['radical'];
      this.state.kanji    = computed['kanji'];
      this.state.vocab    = computed['vocabulary'];

    }).catch(() => {
      if (currentRequestId !== this.requestId) return;
      this.isLoading = false;
      this.errorMessage = 'FAILED TO FETCH DATA. CHECK YOUR API KEY.';
      this.state.user = null;
    });
  }
}
