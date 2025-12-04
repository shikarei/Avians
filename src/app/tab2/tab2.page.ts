import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab2Page implements OnInit {

  observations: any[] = [];

  private dataService = inject(DataService);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);

  ngOnInit() {

    this.dataService.listenObservations((data: any) => {
      if (!data) {
        this.observations = [];
        return;
      }

      this.observations = Object.entries(data).map(([id, obs]: any) => ({
        id,
        ...obs
      }));

      console.log("OBS:", this.observations);
    });
  }

  edit(id: string) {
    this.navCtrl.navigateForward(['/createpoint', id]);
  }

  async delete(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Observation',
      message: 'Are you sure you want to delete this observation?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', handler: () => this.dataService.deleteObservation(id) }
      ]
    });

    alert.present();
  }

}
