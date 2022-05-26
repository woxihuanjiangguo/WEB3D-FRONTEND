import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, EMPTY } from 'rxjs';
import { DataService } from '../services/data.service';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-world',
  templateUrl: './world.component.html',
  styleUrls: ['./world.component.css']
})
export class WorldComponent implements OnInit {
  loaded: boolean = false;

  constructor(private router: Router,
    private authService: AuthService,
    private dataService: DataService) { }

  ngOnInit(): void {
    //todo
    // this.redirect();
    this.debug();
  }

  debug(): void{
    localStorage.setItem('username', 'mike');
    localStorage.setItem('modelName', 'blueBot');
  }

  redirect(): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['login']);
    } else {
      // refresh and may expire token
      this.authService.refresh()
        .pipe(catchError(err => {
          localStorage.clear();
          this.dataService.isLoggedIn.next(false);
          this.router.navigate(['login']);
          return EMPTY;
        })).subscribe((result: any) => {
        });
    }
  }

  setLoaded(loaded: boolean) {
    this.loaded = loaded;
  }

}
