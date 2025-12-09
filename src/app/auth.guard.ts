    import { Injectable } from '@angular/core';
    import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
    

    @Injectable({
      providedIn: 'root'
    })
    export class AuthGuard implements CanActivate {
      constructor( private router: Router) {}

      adminData: any = sessionStorage.getItem('adminData') ? JSON.parse(sessionStorage.getItem('adminData')!) : null;
      userData: any = sessionStorage.getItem('userData') ? JSON.parse(sessionStorage.getItem('userData')!) : null;

      isLoggedIn(): boolean {
        if (this.adminData) {
        return true; // Replace with actual authentication check logic
        }
        return false; // User is not authenticated
      }

      canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean {
        if (this.isLoggedIn()) {
          return true;
        } else {
          this.router.navigate(['/home']); // Redirect to login page if not authenticated
          return false;
        }
      }
    }