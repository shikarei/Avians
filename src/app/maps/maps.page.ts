import { Component, OnInit, inject } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import * as L from 'leaflet';
import { DataService } from '../data.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {

  map!: L.Map;
  private markers: { [key: string]: L.Marker } = {};

  private dataService = inject(DataService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);

  constructor() { }

  async loadPoints() {
    // Clear existing markers
    for (const key in this.markers) {
      this.markers[key].remove();
    }
    this.markers = {};

    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates.split(',').map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(this.map);

        // Store marker instance
        this.markers[key] = marker;

        const popupContent = `
          <div>
            <b>${point.name}</b>
            <hr class="popup-hr">
            <div class="popup-delete-container">
              <ion-icon id="edit-btn-${key}" class="popup-edit-icon" name="create-outline"></ion-icon>
              <ion-icon id="delete-btn-${key}" class="popup-delete-icon" name="trash-outline"></ion-icon>
            </div>
          </div>`;
        marker.bindPopup(popupContent);
      }
    }

    this.map.on('popupopen', (e) => {
      const popup = e.popup;
      const content = popup.getContent();
      if (typeof content === 'string') {
        // Edit button listener
        const editMatch = content.match(/id="edit-btn-(.*?)"/);
        if (editMatch && editMatch[1]) {
          const pointId = editMatch[1];
          const editBtn = popup.getElement()?.querySelector(`#edit-btn-${pointId}`);
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              this.map.closePopup();
              this.navCtrl.navigateForward(['/createpoint', pointId]);
            });
          }
        }

        // Delete button listener
        const deleteMatch = content.match(/id="delete-btn-(.*?)"/);
        if (deleteMatch && deleteMatch[1]) {
          const pointId = deleteMatch[1];
          const deleteBtn = popup.getElement()?.querySelector(`#delete-btn-${pointId}`);
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              this.confirmDelete(pointId);
            });
          }
        }
      }
    });
  }

  async confirmDelete(pointId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this point?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          handler: () => {
            this.deletePoint(pointId);
          },
        },
      ],
    });
    await alert.present();
  }

  async deletePoint(pointId: string) {
    try {
      await this.dataService.deletePoint(pointId);
      if (this.markers[pointId]) {
        this.markers[pointId].remove();
        delete this.markers[pointId];
      }
      this.map.closePopup();
    } catch (error) {
      console.error('Error deleting point:', error);
    }
  }

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView([-7.7956, 110.3695], 13);

        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        });

        osm.addTo(this.map);

        // Load points from Firebase
        this.loadPoints();
      });
    }
  }
}
