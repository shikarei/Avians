import { Injectable } from '@angular/core';
import { ref, push, onValue, remove, get, update } from 'firebase/database';
import { database } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Save a new point
  savePoint(point: { name: string, coordinates: string }) {
    const pointsRef = ref(database, 'points');
    return push(pointsRef, point);
  }

  // Get all points
  getPoints() {
    const pointsRef = ref(database, 'points');
    return new Promise((resolve, reject) => {
      onValue(pointsRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data);
      }, (error) => {
        reject(error);
      });
    });
  }

  // Delete a point
  deletePoint(id: string) {
    const pointRef = ref(database, `points/${id}`);
    return remove(pointRef);
  }

  // Get a single point by ID
  getPointById(id: string) {
    const pointRef = ref(database, `points/${id}`);
    return get(pointRef);
  }

  // Update a point
  updatePoint(id: string, data: { name: string, coordinates: string }) {
    const pointRef = ref(database, `points/${id}`);
    return update(pointRef, data);
  }
}
