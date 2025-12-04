import { Injectable } from '@angular/core';
import { ref, set, onValue, remove, get, update } from 'firebase/database';
import { database } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // ========================================
  // CREATE — Save a new observation
  // ========================================
  saveObservation(data: {
    species: string,
    latitude: number,
    longitude: number,
    count: number,
    date: string,
    photoPath: string,
    audioPath: string,
    observer: string
  }) {
    const id = `obs-${Date.now()}`;
    const refPath = ref(database, `observation/${id}`);
    return set(refPath, data);
  }

  // ========================================
  // READ — Get all observations
  // ========================================
  getObservations() {
    const obsRef = ref(database, 'observation');
    return new Promise((resolve, reject) => {
      onValue(
        obsRef,
        snapshot => resolve(snapshot.val()),
        error => reject(error)
      );
    });
  }

  // ========================================
  // REALTIME LISTENER — Listen for changes
  // ========================================
  listenObservations(callback: (data: any) => void) {
    const obsRef = ref(database, 'observation');
    onValue(obsRef, snapshot => {
      callback(snapshot.val());
    });
  }

  // ========================================
  // READ — Get a single observation by ID
  // ========================================
  getObservationById(id: string) {
    const obsRef = ref(database, `observation/${id}`);
    return get(obsRef);
  }

  // ========================================
  // UPDATE — Update an observation
  // ========================================
  updateObservation(id: string, data: {
    species?: string,
    latitude?: number,
    longitude?: number,
    count?: number,
    date?: string,
    photoPath?: string,
    audioPath?: string,
    observer?: string
  }) {
    const obsRef = ref(database, `observation/${id}`);
    return update(obsRef, data);
  }

  // ========================================
  // DELETE — Delete an observation
  // ========================================
  deleteObservation(id: string) {
    const obsRef = ref(database, `observation/${id}`);
    return remove(obsRef);
  }
}
