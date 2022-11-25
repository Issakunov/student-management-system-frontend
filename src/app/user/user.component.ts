import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { NotificationType } from '../enum/notification-type.enum';
import { CustomeHttpResponse } from '../model/custom-http-response';
import { User } from '../model/user';
import { NotificationService } from '../service/notification.service';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  
  private titleSubject = new BehaviorSubject<string>('Users');
  public titleAction$ = this.titleSubject.asObservable();
  public users!: User[];
  public refreshing!: boolean;
  private subscriptions: Subscription[] = [];
  public selectedUser!: User;
  public fileName!: string | null;
  public profileImage!: File | null;
  public editUser = new User();
  private currentUsername!: string;
  
  constructor(private userService: UserService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.getUsers(true);
  }
  
  public changeTitle(title: string): void {
    this.titleSubject.next(title);
  }
  public getUsers(showNotification: boolean): void {
    this.refreshing = true;
    this.subscriptions.push(
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
    )
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
    const formData = this.userService.createUserFormData(null, userForm.value, this.profileImage);
    this.subscriptions.push(
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
    this.subscriptions.push(
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

  public onDeleteUser(userId: number): void {
    this.subscriptions.push(
      this.userService.deleteUser(userId).subscribe(
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
    this.subscriptions.push(
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
}
