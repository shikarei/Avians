import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab1Page implements OnInit {

  birdList = [
    {
      name: "Flores Scops Owl",
      indoName: "Celepuk Flores",
      trait: "Berukuran kecil dengan bulu kecokelatan; sering bersembunyi di pepohonan rapat pada siang hari.",
      habitat: "Ruteng – Ranaka (Hutan Pegunungan)",
      photo: "assets/birds/Flores_Scops_Owl_36.jpg"
    },
    {
      name: "Bare-throated Whistler",
      indoName: "Kancilan Flores",
      trait: "Memiliki area bulu berwarna merah dan kuning cerah dan tubuh kokoh; sering terlihat bertengger di cabang rendah.",
      habitat: "Ruteng – Ranaka (Hutan Pegunungan)",
      photo: "assets/birds/Bare-throated_Whistler_27.jpg"
    },
    {
      name: "Flores Minivet",
      indoName: "Sepah Kerdil",
      trait: "Burung kecil dengan warna tubuh kontras dan aktif bergerak dalam kelompok kecil saat mencari serangga.",
      habitat: "Ruteng – Ranaka",
      photo: "assets/birds/Flores_Minivet_102.jpg"
    },
    {
      name: "Flores Jungle-Flycatcher",
      indoName: "Sikatan Rimba Flores",
      trait: "Berciri tubuh mungil dengan warna kusam dan sering menunggu mangsa dari ranting rendah sebelum menyambar cepat.",
      habitat: "Ruteng – Ranaka",
      photo: "assets/birds/Flores_Jungle-Flycatcher_47.jpg"
    },
    {
      name: "Russet-capped Tesia",
      indoName: "Tesia Timor",
      trait: "Sangat kecil, berekor pendek, dan banyak bergerak di lantai hutan sambil melompat di antara semak rapat.",
      habitat: "Ruteng – Ranaka",
      photo: "assets/birds/Russet-capped_Tesia_15.jpg"
    },
    {
      name: "Pitta Elegans",
      indoName: "Paok Laus",
      trait: "Memiliki warna tubuh sangat mencolok dan sering melompat di tanah untuk mencari serangga dan cacing.",
      habitat: "Mbeliling – Sano Nggoang",
      photo: "assets/birds/Elegant_Pitta_6.jpg"
    },
    {
      name: "Flores Monarch",
      indoName: "Kehicap Flores",
      trait: "Tubuh ramping dan lincah, sering bergerak cepat di kanopi rendah sambil mengejar serangga terbang.",
      habitat: "Mbeliling – Sano Nggoang",
      photo: "assets/birds/Flores_Monarch_4.jpg"
    },
    {
      name: "Timor Leaf Warbler",
      indoName: "Cikrak Timor",
      trait: "Kecil dan gesit, sering terlihat memeriksa daun satu per satu untuk mencari serangga kecil.",
      habitat: "Mbeliling – Sano Nggoang",
      photo: "assets/birds/Flores_Leaf_Warbler_12.jpg"
    }
  ];


  constructor() { }

  ngOnInit(): void { }
}
