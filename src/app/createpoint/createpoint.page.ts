import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import { ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import 'leaflet.heat/dist/leaflet-heat.js';

// Capacitor Filesystem
import { Filesystem, Directory } from '@capacitor/filesystem';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';

const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {

  map!: L.Map;
  marker!: L.Marker;

  // Base Map References
  osmLayer!: L.TileLayer;
  esriLayer!: L.TileLayer;

  // FORM FIELDS
  species: string = '';
  count!: number;
  date: string = '';
  observer: string = '';

  // Photo Local
  photo: string = '';
  selectedFile: File | null = null;
  photoPreview: string | null = null;

  // Audio Local
  audio: string = '';
  selectedAudio: File | null = null;
  audioPreview: string | null = null;
  audioName: string | null = null;

  latitude!: number;
  longitude!: number;

  isEditMode: boolean = false;
  observationId: string | null = null;
  pageTitle: string = 'Add Observation';
  buttonText: string = 'Save';

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit() {
    const latParam = this.route.snapshot.queryParamMap.get('lat');
    const lngParam = this.route.snapshot.queryParamMap.get('lng');

    if (latParam && lngParam) {
      this.latitude = parseFloat(latParam);
      this.longitude = parseFloat(lngParam);
    } else {
      this.latitude = -7.7956;
      this.longitude = 110.3695;
    }

    this.observationId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.observationId;

    if (this.isEditMode) {
      this.pageTitle = 'Edit Observation';
      this.buttonText = 'Update';
    }

    setTimeout(() => {
      this.setupMap();

      if (this.isEditMode && this.observationId) {
        this.loadObservation(this.observationId);
      } else {
        const pos = L.latLng(this.latitude, this.longitude);
        this.marker.setLatLng(pos);
        this.map.setView(pos, 15);
      }
    });
  }

  // ========================================
  // MAP INITIALIZE
  // ========================================
  setupMap() {
    this.map = L.map('mapcreate').setView([this.latitude, this.longitude], 13);

    // Store layer references
    this.osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; OpenStreetMap contributors' }
    ).addTo(this.map);

    this.esriLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'ESRI' }
    );

    const start = L.latLng(this.latitude, this.longitude);
    this.marker = L.marker(start, { draggable: true }).addTo(this.map);

    this.marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      this.latitude = pos.lat;
      this.longitude = pos.lng;
    });
  }


  // ========================================
  // SWITCH BASEMAP (FAB BUTTON)
  // ========================================
  setBasemap(type: string) {
    if (!this.map) return;

    if (type === 'osm') {
      this.map.removeLayer(this.esriLayer);
      this.osmLayer.addTo(this.map);
    } else if (type === 'esri') {
      this.map.removeLayer(this.osmLayer);
      this.esriLayer.addTo(this.map);
    }
  }


  // ========================================
  // LOAD EXISTING OBSERVATION
  // ========================================
  async loadObservation(id: string) {
    const snapshot = await this.dataService.getObservationById(id);

    if (!snapshot.exists()) {
      console.error("Observation not found.");
      this.navCtrl.navigateBack('/tabs/maps');
      return;
    }

    const obs = snapshot.val();

    this.species = obs.species;
    this.count = obs.count;
    this.date = obs.date;
    this.observer = obs.observer;

    this.photo = obs.photoPath || '';
    this.audio = obs.audioPath || '';

    this.photoPreview = this.photo;
    this.audioPreview = this.audio;

    this.latitude = obs.latitude;
    this.longitude = obs.longitude;

    const pos = L.latLng(this.latitude, this.longitude);
    this.map.setView(pos, 15);
    this.marker.setLatLng(pos);
  }

  // ========================================
  // FILE SELECTION
  // ========================================
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.photoPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  onAudioSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedAudio = file;
    this.audioName = file.name;
    this.audioPreview = URL.createObjectURL(file);
  }

  // ========================================
  // SAVE LOCAL FILES
  // ========================================
  async saveLocalFile(file: File, folder: string): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const path = `${folder}/${fileName}`;

    const base64 = await this.convertToBase64(file);

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Data,
    });

    return path;
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // ========================================
  // SAVE
  // ========================================
  async save() {
    if (!this.species || !this.date) {
      const alert = await this.alertCtrl.create({
        header: 'Incomplete Fields',
        message: 'Please complete all required fields.',
        buttons: ['OK']
      });
      return alert.present();
    }

    let photoPath = this.photo || '';
    let audioPath = this.audio || '';

    if (this.selectedFile) {
      try {
        photoPath = await this.saveLocalFile(this.selectedFile, 'photos');
      } catch (err) {
        console.warn("Local photo save failed:", err);
      }
    }

    if (this.selectedAudio) {
      try {
        audioPath = await this.saveLocalFile(this.selectedAudio, 'audio');
      } catch (err) {
        console.warn("Local audio save failed:", err);
      }
    }

    const data = {
      species: this.species,
      count: this.count ?? 1,
      date: this.date,
      photoPath,
      audioPath,
      observer: this.observer || '',
      latitude: this.latitude,
      longitude: this.longitude
    };

    try {
      if (this.isEditMode && this.observationId) {
        await this.dataService.updateObservation(this.observationId, data);
      } else {
        await this.dataService.saveObservation(data);
      }

      this.navCtrl.navigateBack('/tabs/maps');

    } catch (err) {
      const alert = await this.alertCtrl.create({
        header: "Save Failed",
        message: (err as any)?.message || "An unexpected error occurred.",
        buttons: ["OK"]
      });
      alert.present();
    }
  }
}
