import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import 'leaflet.heat/dist/leaflet-heat.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { IonicModule, AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-maps',
  standalone: true,
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  imports: [CommonModule, FormsModule, RouterModule, IonicModule]
})
export class MapsPage implements OnInit {

  map!: L.Map;
  osmLayer!: L.TileLayer;
  esriLayer!: L.TileLayer;
  markers: { [key: string]: L.Marker } = {};
  heatLayer: any;

  firstRender: boolean = true;

  accuracyCircle: any;
  locateMarker: any;
  longPressTimer: any;
  rawObservations: any = {};
  speciesList: string[] = [];
  selectedSpecies: string = 'all';
  startDate: string = '';
  endDate: string = '';
  todayDate: string = new Date().toISOString();
  isPlaying: boolean = false;
  playProgress: number = 0;
  currentPlayDate: Date = new Date();
  playInterval: any;
  isSidebarOpen: boolean = false;

  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);

  constructor() { }

  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  applyDateFilterAndClose() { this.applyDateFilter(); this.isSidebarOpen = false; }

  stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  createColoredIcon(color: string) {
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" width="40" height="40" style="filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));">
        <path d="M12 2C8.1 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.1-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>`;
    return L.divIcon({ className: 'custom-pin', html: svgIcon, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
  }

  async loadLocalFile(path: string, type: 'image' | 'audio'): Promise<string> {
    try {
      const result = await Filesystem.readFile({ path, directory: Directory.Data });
      return type === 'image' ? `data:image/jpeg;base64,${result.data}` : `data:audio/mp3;base64,${result.data}`;
    } catch { return ''; }
  }

  async renderMarkers(observations: any, filterSpecies: string = 'all') {

    if (!observations) return;

    const heatData: any[] = [];

    // LOOP semua observation
    for (const id in observations) {
      const obs = observations[id];

      // ================ 1) Marker dibuat SEKALI SAJA =================
      if (!this.markers[id]) {
        const marker = L.marker([obs.latitude, obs.longitude], {
          icon: this.createColoredIcon(this.stringToColor(obs.species))
        });

        // Simpan marker
        this.markers[id] = marker;

        // Render popup sekali saja
        let photoBase64 = obs.photoPath ? await this.loadLocalFile(obs.photoPath, 'image') : '';
        let audioBase64 = obs.audioPath ? await this.loadLocalFile(obs.audioPath, 'audio') : '';

        const popup = `
        <div>
          <b>${obs.species}</b>
          <div class="popup-info">
            <div class="info-item"><span>Date</span><span>${obs.date}</span></div>
            <div class="info-item"><span>Count</span><span>${obs.count}</span></div>
          </div>
          ${photoBase64 ? `<img src="${photoBase64}" class="popup-photo"/>` : ''}
          ${audioBase64 ? `<audio controls style="width:100%; margin-top:10px;"><source src="${audioBase64}" type="audio/mp3"/></audio>` : ''}
          <hr class="popup-hr"/>
          <div class="popup-actions">
            <ion-icon id="edit-btn-${id}" name="create-outline"></ion-icon>
            <ion-icon id="delete-btn-${id}" name="trash-outline"></ion-icon>
          </div>
        </div>`;

        this.markers[id].bindPopup(popup, { className: 'avian-popup' });
      }

      // ============== 2) Filter species → marker opacity saja ================
      if (filterSpecies !== 'all' && obs.species !== filterSpecies) {
        this.markers[id].setOpacity(0);    // sembunyikan
      } else {
        this.markers[id].setOpacity(1);    // tampilkan
      }

      // =============== 3) Heat data (HANYA LATLNGS) =========================
      heatData.push([obs.latitude, obs.longitude, obs.count || 1]);
    }

    // =============== 4) Build heatmap hanya sekali ==========================
    if (!this.heatLayer) {
      this.heatLayer = (L as any).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.3
      }).addTo(this.map);
    } else {
      this.heatLayer.setLatLngs(heatData);
    }

    // =============== 5) Marker pertama kali harus addTo(map) ================
    if (this.firstRender) {
      for (const id in this.markers) {
        this.markers[id].addTo(this.map);
      }
      this.firstRender = false;
    }

    this.updateLayerVisibility();
    this.setupPopupListeners();
  }

  updateLayerVisibility() {
    if (!this.map || !this.heatLayer) return;

    const zoom = this.map.getZoom();

    // SHOW HEATMAP, HIDE MARKERS
    if (zoom <= 12) {

      // hide markers ONLY IF currently visible
      for (const k in this.markers) {
        if (this.map.hasLayer(this.markers[k])) {
          this.map.removeLayer(this.markers[k]);
        }
      }

      // show heatmap ONLY IF not visible
      if (!this.map.hasLayer(this.heatLayer)) {
        this.heatLayer.addTo(this.map);
      }

    } else {
      // SHOW MARKERS, HIDE HEATMAP

      // hide heat only if currently visible
      if (this.map.hasLayer(this.heatLayer)) {
        this.map.removeLayer(this.heatLayer);
      }

      // show markers ONLY IF not visible
      for (const k in this.markers) {
        if (!this.map.hasLayer(this.markers[k])) {
          this.markers[k].addTo(this.map);
        }
      }
    }
  }

  resetDateFilter() {
    this.stopPlay();
    this.startDate = ''; this.endDate = ''; this.selectedSpecies = 'all';
    this.playProgress = 0;
    this.renderMarkers(this.rawObservations, this.selectedSpecies);
    this.isSidebarOpen = false;
  }

  applyDateFilter() {
    if (!this.startDate || !this.endDate) {
      this.renderMarkers(this.rawObservations, this.selectedSpecies);
      return;
    }
    this.currentPlayDate = new Date(this.endDate);
    this.playProgress = 100;
    this.filterAndRender(new Date(this.startDate), new Date(this.endDate));
  }

  filterAndRender(start: Date, end: Date) {
    const filtered: any = {};
    for (const id in this.rawObservations) {
      const obs = this.rawObservations[id];
      const obsDate = new Date(obs.date);
      const s = new Date(start); s.setHours(0, 0, 0, 0);
      const e = new Date(end); e.setHours(23, 59, 59, 999);
      obsDate.setHours(0, 0, 0, 0);
      if (obsDate >= s && obsDate <= e) filtered[id] = obs;
    }
    this.renderMarkers(filtered, this.selectedSpecies);
  }

  togglePlay() { this.isPlaying ? this.stopPlay() : this.startPlay(); }

  startPlay() {
    if (!this.startDate || !this.endDate) return;
    this.isPlaying = true;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    let step = 0;
    this.playInterval = setInterval(() => {
      step++;
      const newDate = new Date(start);
      newDate.setDate(newDate.getDate() + step);
      this.currentPlayDate = newDate;
      this.playProgress = (step / totalDays) * 100;
      this.filterAndRender(start, newDate);
      if (newDate >= end) { this.stopPlay(); this.playProgress = 100; }
    }, 800);
  }

  stopPlay() { this.isPlaying = false; if (this.playInterval) clearInterval(this.playInterval); }

  setupLongPress() {
    this.map.on('mousedown', (e: any) => { this.longPressTimer = setTimeout(() => { this.handleLongPress(e.latlng); }, 800); });
    this.map.on('mouseup', () => clearTimeout(this.longPressTimer));
    this.map.on('mouseout', () => clearTimeout(this.longPressTimer));
    this.map.on('dragstart', () => clearTimeout(this.longPressTimer));
  }

  handleLongPress(latlng: any) {
    this.navCtrl.navigateForward(['/createpoint'], { queryParams: { lat: latlng.lat, lng: latlng.lng } });
  }

  setBasemap(type: string) {
    if (!this.map) return;
    if (type === 'osm') { this.map.removeLayer(this.esriLayer); this.osmLayer.addTo(this.map); }
    else { this.map.removeLayer(this.osmLayer); this.esriLayer.addTo(this.map); }
  }

  ngOnInit() {
    setTimeout(() => {
      this.map = L.map('map', { zoomControl: false }).setView([-8.672420476311634, 120.46520388533261], 12.5);

      // 🔴 UBAH: Zoom Control di Kiri Atas
      L.control.zoom({ position: 'topleft' }).addTo(this.map);

      this.osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(this.map);
      this.esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'ESRI' });

      this.map.on('zoomend', () => this.updateLayerVisibility());
      this.setupLongPress();

      this.dataService.listenObservations((data) => {
        this.rawObservations = data || {};
        const set = new Set<string>();
        for (const id in this.rawObservations) set.add(this.rawObservations[id].species);
        this.speciesList = Array.from(set);
        this.renderMarkers(this.rawObservations);
      });
    });
  }

  setupPopupListeners() {
    this.map.off('popupopen');
    this.map.on('popupopen', (e: any) => {
      const popup = e.popup;
      const content = popup.getElement();
      const editID = popup.getContent().match(/edit-btn-(.*?)"/);
      const deleteID = popup.getContent().match(/delete-btn-(.*?)"/);
      if (editID) content.querySelector(`#edit-btn-${editID[1]}`)?.addEventListener('click', () => { this.map.closePopup(); this.navCtrl.navigateForward(['/createpoint', editID[1]]); });
      if (deleteID) content.querySelector(`#delete-btn-${deleteID[1]}`)?.addEventListener('click', () => this.confirmDelete(deleteID[1]));
    });
  }

  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({ header: 'Delete observation?', buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', handler: () => this.deleteObservation(id) }] });
    await alert.present();
  }

  async deleteObservation(id: string) {
    await this.dataService.deleteObservation(id);
    if (this.markers[id]) this.markers[id].remove();
    this.map.closePopup();
  }

  dismissStartModal() { (document.querySelector('ion-modal[trigger="open-start-date"]') as HTMLIonModalElement)?.dismiss(); }
  dismissEndModal() { (document.querySelector('ion-modal[trigger="open-end-date"]') as HTMLIonModalElement)?.dismiss(); }

  locateMe() {
    navigator.geolocation.getCurrentPosition((pos) => {
      this.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);
      this.accuracyCircle = L.circle([pos.coords.latitude, pos.coords.longitude], { radius: pos.coords.accuracy || 20, color: '#4A90E2' }).addTo(this.map);
    });
  }

  ionViewWillLeave() { this.stopPlay(); }
}
