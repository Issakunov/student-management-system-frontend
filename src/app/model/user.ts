export class User {

public userId!: string;
public firstName: string;
public lastName: string;
public username: string;
public email: string;
public loginDateDisplay!: Date;
public lastLoginDateDisplay?: Date;
public joinDate!: Date;
public profileImageUrl!: string;
public enabled: boolean;
public notLocked: boolean;
public role: string;
public authorities: [];

constructor() {
    this.userId = '';
    this.firstName = '';
    this.lastName = '';
    this.username = '';
    this.email = '';
    this.profileImageUrl = '';
    this.enabled = false;
    this.notLocked = false;
    this.role = '';
    this.authorities = [];
}

}