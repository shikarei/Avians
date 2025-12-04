import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DataService } from '../data.service';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

interface Observation {
  id?: string;
  species?: string;
  date?: string;
  count?: number;
  observer?: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
}

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab3Page implements OnInit {

  rawData: Record<string, Observation> | null = null;
  filteredList: Observation[] = [];

  totalObservations = 0;
  totalBirdsCount = 0;
  uniqueSpecies = 0;
  diversityIndex = 0;
  speciesList: string[] = [];
  selectedSpecies: string = '__all';

  topSpeciesList: { name: string, count: number }[] = [];
  latestObservation: Observation | null = null;

  speciesChart: any;
  timelineChart: any;

  private dataService = inject(DataService);

  // =====================================================
  // COLOR PALETTE (THEME — BABY BLUE + MARIGOLD + PASTEL)
  // =====================================================
  generateColorPalette(count: number): string[] {
    const baseColors = [
      '#5DADE2', '#89CFF0', '#B4E4FF',
      '#FDB931', '#FFD56B', '#F4A300',
      '#6FCF97', '#A3E4D7', '#16A085',
      '#D7BDE2', '#F7C6C7', '#FDEBD0'
    ];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(baseColors[i % baseColors.length]);
    }
    return result;
  }

  // =====================================================
  // MONTH COLORS (line chart)
  // =====================================================
  monthColors: string[] = [
    '#00bcd4', '#9c27b0', '#ff9800', '#4caf50',
    '#ff5722', '#3f51b5', '#009688', '#e91e63',
    '#f44336', '#8e44ad', '#2980b9', '#16a085'
  ];

  // =====================================================
  // INIT
  // =====================================================
  ngOnInit() {
    this.dataService.listenObservations((data: any) => {
      this.rawData = data || null;
      this.applyFiltersAndCompute();
      setTimeout(() => this.renderCharts(), 50);
    });
  }

  // =====================================================
  // FILTER LOGIC
  // =====================================================
  applyFiltersAndCompute() {
    if (!this.rawData) {
      this.filteredList = [];
      this.updateSummaries([]);
      return;
    }

    const arr: Observation[] = Object.entries(this.rawData).map(([id, v]) => ({ id, ...v }));

    const speciesSet = new Set<string>();
    for (const o of arr) if (o.species) speciesSet.add(o.species);
    this.speciesList = Array.from(speciesSet).sort();

    this.filteredList =
      this.selectedSpecies !== '__all'
        ? arr.filter(x => x.species === this.selectedSpecies)
        : arr;

    this.updateSummaries(this.filteredList);
  }

  resetFilter() {
    this.selectedSpecies = '__all';
    this.applyFiltersAndCompute();
    this.renderCharts();
  }

  onFilterChange() {
    this.applyFiltersAndCompute();
    this.renderCharts();
  }

  // =====================================================
  // SUMMARY
  // =====================================================
  updateSummaries(list: Observation[]) {
    this.totalObservations = list.length;
    this.totalBirdsCount = list.reduce((s, v) => s + (Number(v.count) || 0), 0);

    const speciesCount: Record<string, number> = {};
    for (const o of list) {
      const s = o.species || 'Unknown';
      speciesCount[s] = (speciesCount[s] || 0) + 1;
    }

    this.uniqueSpecies = Object.keys(speciesCount).length;
    this.diversityIndex = this.uniqueSpecies / Math.max(1, this.totalObservations);

    const sorted = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);
    this.topSpeciesList = sorted.slice(0, 5).map(([name, count]) => ({ name, count }));

    const withDate = list.filter(x => x.date).slice();
    withDate.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
    this.latestObservation = withDate[0] || list[list.length - 1] || null;
  }

  // =====================================================
  // RENDER CHARTS
  // =====================================================
  renderCharts() {
    this.renderSpeciesChart();
    this.renderTimelineChart();
  }

  // =====================================================
  // BAR CHART (warna beda tiap species)
  // =====================================================
  renderSpeciesChart() {
    const ctx = document.getElementById('speciesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.speciesChart) this.speciesChart.destroy();

    const counts: Record<string, number> = {};
    for (const o of this.filteredList) {
      const sp = o.species || 'Unknown';
      counts[sp] = (counts[sp] || 0) + 1;
    }

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    const colors = this.generateColorPalette(labels.length);

    this.speciesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Species Count',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c + 'AA'),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  // =====================================================
  // LINE CHART — warna per bulan
  // =====================================================
  renderTimelineChart() {
    const ctx = document.getElementById('timelineChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.timelineChart) this.timelineChart.destroy();

    const dateCounts: Record<string, number> = {};
    const monthGroups: Record<string, Record<string, number>> = {};

    for (const o of this.filteredList) {
      if (!o.date) continue;

      const clean = this.normalizeDateString(o.date);
      const dt = new Date(clean);
      const monthKey = `${dt.getFullYear()}-${dt.getMonth()}`;

      if (!monthGroups[monthKey]) monthGroups[monthKey] = {};
      monthGroups[monthKey][clean] = (monthGroups[monthKey][clean] || 0) + 1;

      dateCounts[clean] = (dateCounts[clean] || 0) + 1;
    }

    const labels = Object.keys(dateCounts).sort();

    const datasets = Object.entries(monthGroups).map(([monthKey, values], i) => {
      const [year, month] = monthKey.split('-');
      const pretty = new Date(Number(year), Number(month), 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      const color = this.monthColors[i % this.monthColors.length];

      return {
        label: pretty,
        data: labels.map(l => values[l] ?? null),
        borderColor: color,
        backgroundColor: color + '40',
        fill: true,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  normalizeDateString(d: string): string {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toISOString().split('T')[0];
  }

  downloadCSV() {
    const list = this.filteredList;
    if (!list.length) {
      alert('No data to export.');
      return;
    }

    const headers = ['id', 'species', 'date', 'count', 'observer', 'latitude', 'longitude', 'photo'];
    const rows = list.map(o => [
      o.id, o.species, o.date, o.count, o.observer, o.latitude, o.longitude, o.photo
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${v ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `avians_insights.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
