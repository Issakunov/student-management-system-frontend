import { Injectable } from '@angular/core';
import { environment } from 'src/environment/environment';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { CustomeHttpResponse } from '../model/custom-http-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private host = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.host}/api/v1/users/list`);
  }

  public addUser(formData: FormData): Observable<User> {
    return this.http.post<User>(`${this.host}/api/v1/users/add`, formData);
  }

  public updateUser(formData: FormData): Observable<User> {
    return this.http.put<User>(`${this.host}/api/v1/users/update`, formData);
  }

  public resetPassword(email: string): Observable<CustomeHttpResponse> {
    return this.http.get<CustomeHttpResponse>(`${this.host}/api/v1/users/reset-password/${email}`);
  }

  public updateProfileImage(formData: FormData): Observable<HttpEvent<any>> {
    return this.http.post<User>(`${this.host}/api/v1/users/update-profile-image`, formData, {reportProgress: true, observe: 'events'});
  }

  public deleteUser(userId: number): Observable<CustomeHttpResponse> {
    return this.http.delete<CustomeHttpResponse>(`${this.host}/api/v1/users/delete/${userId}`);
  }

  public addUserToLocalCache(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  public getUsersFromLocalCache(): User[] {
    if (localStorage.getItem('users')) {
      return JSON.parse(localStorage.getItem('users')!);
    }
    return null as any;
  }
  public createUserFormData(loggedInUsername: string, user: User, profileImage: any): FormData {
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername);
    formData.append('username', user.username);
    formData.append('firstName', user.firstName);
    formData.append('lastName', user.lastName);
    formData.append('email', user.email);
    formData.append('role', user.role);
    formData.append('profileImage', profileImage);
    formData.append('isEnabled', JSON.stringify(user.enabled));
    formData.append('isNotLocked', JSON.stringify(user.notLocked));
    return formData;
  }
}
