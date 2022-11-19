export class User {

public id!: number;
public userId!: string;
public firstName: string;
public lastName: string;
public username: string;
public email: string;
public loginDateDisplay!: Date;
public joinDate!: Date;
public profileImageUrl!: string;
public enabled: boolean;
public isNotLocked: boolean;
public role: string;
public authorities: [];

constructor() {
    this.firstName = '';
    this.lastName = '';
    this.username = '';
    this.email = '';
    this.enabled = false;
    this.isNotLocked = false;
    this.role = '';
    this.authorities = [];
}

}