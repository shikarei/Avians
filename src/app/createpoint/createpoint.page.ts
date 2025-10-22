import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import { ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

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

  name: string = '';
  coordinates: string = '';

  isEditMode: boolean = false;
  pointId: string | null = null;
  pageTitle: string = 'Create Point';
  buttonText: string = 'Save';

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit() {
    this.pointId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.pointId;

    if (this.isEditMode) {
      this.pageTitle = 'Edit Point';
      this.buttonText = 'Update';
    }

    setTimeout(() => {
      this.setupMap();
      if (this.isEditMode && this.pointId) {
        this.loadPointData(this.pointId);
      }
    });
  }

  setupMap() {
    this.map = L.map('mapcreate').setView([-7.7956, 110.3695], 13);

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'ESRI'
    });

    osm.addTo(this.map);

    var baseMaps = {
      "OpenStreetMap": osm,
      "Esri World Imagery": esri
    };

    L.control.layers(baseMaps).addTo(this.map);

    var tooltip = 'Drag the marker or move the map<br>to change the coordinates<br>of the location';
    this.marker = L.marker([-7.7956, 110.3695], { draggable: true });
    this.marker.addTo(this.map);
    this.marker.bindPopup(tooltip);
    this.marker.openPopup();

    this.marker.on('dragend', (e) => {
      let latlng = e.target.getLatLng();
      this.coordinates = `${latlng.lat.toFixed(9)},${latlng.lng.toFixed(9)}`;
    });
  }

  async loadPointData(id: string) {
    const snapshot = await this.dataService.getPointById(id);
    if (snapshot.exists()) {
      const point = snapshot.val();
      this.name = point.name;
      this.coordinates = point.coordinates;
      const latlng = this.coordinates.split(',').map(c => parseFloat(c));
      this.map.setView(latlng as L.LatLngExpression, 15);
      this.marker.setLatLng(latlng as L.LatLngExpression);
    } else {
      // Handle case where point is not found
      console.error('Point not found!');
      this.navCtrl.navigateBack('/tabs/maps');
    }
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        if (this.isEditMode && this.pointId) {
          await this.dataService.updatePoint(this.pointId, { name: this.name, coordinates: this.coordinates });
        } else {
          await this.dataService.savePoint({ name: this.name, coordinates: this.coordinates });
        }
        this.navCtrl.navigateBack('/tabs/maps');
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: this.isEditMode ? 'Update Failed' : 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }

}
