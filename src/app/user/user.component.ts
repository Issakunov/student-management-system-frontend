import { HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NotificationType } from '../enum/notification-type.enum';
import { Role } from '../enum/role.enum';
import { CustomeHttpResponse } from '../model/custom-http-response';
import { FileUploadStatus } from '../model/file-upload.status';
import { User } from '../model/user';
import { AuthenticationService } from '../service/authentication.service';
import { NotificationService } from '../service/notification.service';
import { UserService } from '../service/user.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {
  
  private subs = new SubSink();
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users!: User[];
  public user!: User;
  public refreshing!: boolean;
  private subscriptions: Subscription[] = [];
  public selectedUser!: User;
  public fileName!: any;
  public profileImage!: any;
  public editUser = new User();
  private currentUsername!: string;
  public fileStatus = new FileUploadStatus();
  
  constructor(private router: Router, private authenticationService: AuthenticationService, private userService: UserService, private notificationService: NotificationService) {}

  ngOnInit(): void { 
    this.getUsers(true);
    this.user = this.authenticationService.getUserFromLocalCache();
  }
  
  public changeTitle(title: string): void {
    this.titleSubject.next(title);
  }
  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subs.add(
      this.userService.getUsers().subscribe(
        (response: User[]) => {
          this.userService.addUserToLocalCache(response);
          this.users = response;
          this.refreshing = false;
          if (showNotification) {
            this.sendNotification(NotificationType.SUCCESSS, `${response.length} user(s) loaded successfully.`);
          }
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = false;
        }
      )
    );
  }

  public getSelectedUserProfileImage(): string {
    return this.authenticationService.getUserFromLocalCache().profileImageUrl;
  }
  
  public onSelectUserModal(selectedUser: User): void {
    this.selectedUser = selectedUser;
    this.clickButton('openUserInfo');
  }
  public roleSubstring(role: any): string {
    if(role == 'ROLE_USER') {
      return 'USER';
    }
    if(role == 'ROLE_MANAGER') {
      return 'MANAGER';
    }
    if(role == 'ROLE_ADMIN') {
      return 'ADMIN';
    }
    if(role == 'ROLE_HR') {
      return 'HR';
    }
    if(role == 'ROLE_SUPER_USER') {
      return 'SUPER ADMIN';
    }
    return '';
  }

  public onProfileImageChange(event: any): void {

    this.fileName = event.target.files[0].name;
    this.profileImage = event.target.files[0];
  }

  public saveNewUser(): void {
    this.clickButton('new-user-save');
  }

  public onAddNewUser(userForm: NgForm): void {
    const formData = this.userService.createUserFormData('', userForm.value, this.profileImage);
    this.subs.add(
      this.userService.addUser(formData).subscribe(
        (response: User) => {
          
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          userForm.reset();
          this.sendNotification(NotificationType.SUCCESSS, `${response.firstName} ${response.lastName} added successfully`);
          this.clickButton('new-user-close');
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        }
      )
    );
  }

  public searchUsers(searchTerm: string): void {
    
    let results: User[] = [];
    for (const user of this.userService.getUsersFromLocalCache()) {
        if (user.firstName!.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1,
        user.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1,
        user.username!.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
        results.push(user);
        }
    }
    this.users = results;
    if (results.length === 0 || !searchTerm) {
      // this.users = this.userService.getUsersFromLocalCache();
    }
  }

  public onEditUser(editUser: User): void {
    this.editUser = editUser;
    this.currentUsername = editUser.username;
    this.clickButton('openUserEdit')
  }

  public onUpdateUser(): void {    
    const formData = this.userService.createUserFormData(this.currentUsername, this.editUser, this.profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESSS, `${response.firstName} ${response.lastName} updated successfully`);
          this.clickButton('closeEditUserModalButton');
        },
        (error: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, error.error.message);
        }
      )
    );
  }

  private getUserRole(): string {
    return this.authenticationService.getUserFromLocalCache().role;
  }

  public get isAdmin(): boolean {
    return this.getUserRole() === Role.ADMIN || this.getUserRole() === Role.SUPER_USER;
  }
  public get isUser(): boolean {
    return this.getUserRole() === Role.USER;
  }
  public get isManager(): boolean {
    return this.isAdmin || this.getUserRole() === Role.MANAGER;
  }

  public get isAdminOrManager(): boolean {
    return this.isAdmin || this.isManager;
  }

  public onDeleteUser(username: string): void {
    if (this.authenticationService.getUserFromLocalCache().username === username) {
      this.userService.deleteUser(username);
      this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESSS, `You've deleted yourself and have been logged out`);
    return;
    }
    this.subscriptions.push(
      this.userService.deleteUser(username).subscribe(
        
        (response: CustomeHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESSS, response.message);
          this.getUsers(false);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        }
      )
    )
  }

  public onResetPassword(emailForm: NgForm): void {
    this.refreshing = true;
    const emailAddress = emailForm.value['reset-password-email'];
    this.subs.add(
      this.userService.resetPassword(emailAddress).subscribe(
        (response: CustomeHttpResponse) => {
          this.sendNotification(NotificationType.SUCCESSS, response.message);
          this.refreshing = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.WARNING, errorResponse.error.message);
          this.refreshing = false;
        },
        () => emailForm.reset()
      )
    )
  }

  public onUpdateCurrentUser(user: any): void {
    this.refreshing = true;
    this.currentUsername = this.authenticationService.getUserFromLocalCache().username;
    const formData = this.userService.createUserFormData(this.currentUsername, user, this.profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (response: User) => {
          this.authenticationService.addUserToLocalCache(response);
          this.getUsers(false);
          this.fileName = null;
          this.profileImage = null;
          this.sendNotification(NotificationType.SUCCESSS, `${response.firstName} ${response.lastName} updated successfully`)
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.refreshing = true;
          this.profileImage = null;
        }
      )
    );
  }

  public updateProfileImage(): void {
    this.clickButton('profile-image-input');
  }

  public onUpdateProfileImage(): void {
    const formData = new FormData();
    formData.append('username', this.user.username);
    formData.append('profileImage', this.profileImage);
    this.subs.add(
      this.userService.updateProfileImage(formData).subscribe(
        (event: HttpEvent<any>) => {
          this.reportUploadProgress(event);
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
          this.fileStatus.status = 'done';
        }
      )
    );
  }

  private reportUploadProgress(event: HttpEvent<any>): void {
    switch(event.type) {
      case HttpEventType.UploadProgress:
        this.fileStatus.percentage = Math.round(100 * event.loaded / event.total!);
        this.fileStatus.status = 'progress';
        break;
        case HttpEventType.Response:
          if (event.status === 200) {
            this.user.profileImageUrl = `${event.body.profileImageUrl}?time=${new Date().getTime()}`;
            this.sendNotification(NotificationType.SUCCESSS, `${event.body.firstName}\'s profile image updated successfully`)
            this.fileStatus.status = 'done';
            break;
          }else {
            this.sendNotification(NotificationType.ERROR, `Unable to upload image. Please try again`);
            break;
          }
          default:
            `Finished all processes`
    }
  }
  
  public onLogOut(): void {
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
    this.sendNotification(NotificationType.SUCCESSS, `You've been successfully logged out`);
  }

  private clickButton(buttonId: string): void {
    document.getElementById(buttonId)!.click();
  }
  
  private sendNotification(notificationType: NotificationType, message: string): void {
    if (message) {
      this.notificationService.notify(notificationType, message.toUpperCase());
    }else {
      this.notificationService.notify(notificationType, 'An error occured. Please try again'.toUpperCase());
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
