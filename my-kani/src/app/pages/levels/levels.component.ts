import { Component, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { StateService } from '../../services/state.service';

export interface LevelRow {
  level: number;
  days: number;
  startedAt: string;
  passedAt: string | null;
  isCurrent: boolean;
  barPct: number; // width % relative to max
  kanji: string;  // decorative kanji watermark
}

// A handful of kanji, one per level cycling through
const LEVEL_KANJI = [
  '一','二','三','四','五','六','七','八','九','十',
  '百','千','万','上','下','中','大','小','山','川',
  '日','月','火','水','木','金','土','人','口','手',
  '目','耳','足','力','心','本','文','字','学','年',
  '時','間','国','語','気','天','地','生','死','道'
];

@Component({
  selector: 'app-levels',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './levels.component.html',
  styleUrl: './levels.component.css'
})
export class LevelsComponent implements OnInit {

  levels: LevelRow[] = [];
  avgDays: number = 0;
  fastestLevel: LevelRow | null = null;
  slowestLevel: LevelRow | null = null;
  totalDays: number = 0;

  constructor(public state: StateService) {}

  ngOnInit() {
    if (!this.state.levelProgressions.length) return;
    this.buildLevels();
  }

  buildLevels() {
    const progressions = this.state.levelProgressions;
    const rows: LevelRow[] = [];

    for (let i = 0; i < progressions.length; i++) {
      const p = progressions[i];
      const d = p.data;
      const startedAt = d.unlocked_at ?? d.created_at;
      const passedAt  = d.passed_at ?? null;

      // Days spent: if passed, diff between passed and started
      // If current level (not passed yet), diff from started to now
      let days = 0;
      if (startedAt) {
        const end = passedAt ? new Date(passedAt) : new Date();
        const start = new Date(startedAt);
        days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      rows.push({
        level: d.level,
        days,
        startedAt,
        passedAt,
        isCurrent: !passedAt,
        barPct: 0, // calculated after
        kanji: LEVEL_KANJI[(d.level - 1) % LEVEL_KANJI.length]
      });
    }

    // Calculate bar widths relative to the longest level
    const maxDays = Math.max(...rows.map(r => r.days), 1);
    for (const row of rows) {
      row.barPct = Math.max((row.days / maxDays) * 100, 2);
    }

    // Stats
    const completed = rows.filter(r => r.passedAt);
    this.totalDays = rows.reduce((sum, r) => sum + r.days, 0);
    this.avgDays = completed.length
      ? Math.round(completed.reduce((sum, r) => sum + r.days, 0) / completed.length)
      : 0;

    if (completed.length) {
      this.fastestLevel = completed.reduce((a, b) => a.days < b.days ? a : b);
      this.slowestLevel = completed.reduce((a, b) => a.days > b.days ? a : b);
    }

    this.levels = rows;
  }
}
