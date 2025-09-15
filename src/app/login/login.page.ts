import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  username: string = '';
  password: string = '';

  constructor() { }

  ngOnInit() {
  }

  login() {
    if (this.username === 'admin' && this.password === 'password') {
      window.location.href = 'tabs';
    } else {
      alert('Invalid username or password');
    }
  }
}
