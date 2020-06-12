import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({providedIn: 'root'})

export class LoginService{

    isLoggedIn: boolean = false;
    isModeLogin = new BehaviorSubject<boolean>(null);
    onClose = new Subject();
    constructor(){}

}